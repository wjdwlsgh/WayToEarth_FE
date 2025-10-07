export type LatLng = { latitude: number; longitude: number };

type Mat2 = [number, number, number, number];
type Mat4 = [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number];

export type Kalman2DState = {
  // state: [x, y, vx, vy]
  x: [number, number, number, number];
  P: Mat4;
  q: number; // process noise scalar
  rBase: number; // base measurement noise
  initialized: boolean;
};

// Rough local projection helpers (meters)
export function projectToMeters(origin: LatLng, p: LatLng): { x: number; y: number } {
  const latScale = 110540; // m per deg
  const lonScale = 111320 * Math.cos((origin.latitude * Math.PI) / 180);
  const x = (p.longitude - origin.longitude) * lonScale;
  const y = (p.latitude - origin.latitude) * latScale;
  return { x, y };
}

export function unprojectFromMeters(origin: LatLng, xy: { x: number; y: number }): LatLng {
  const latScale = 110540;
  const lonScale = 111320 * Math.cos((origin.latitude * Math.PI) / 180);
  const latitude = origin.latitude + xy.y / latScale;
  const longitude = origin.longitude + xy.x / lonScale;
  return { latitude, longitude };
}

function mat4Identity(): Mat4 {
  return [1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1];
}

export function createKalman2D(q = 0.1, rBase = 5): Kalman2DState {
  return {
    x: [0, 0, 0, 0],
    P: mat4Identity(),
    q,
    rBase,
    initialized: false,
  };
}

export function kalmanPredict(state: Kalman2DState, dt: number) {
  const [x, y, vx, vy] = state.x;
  const nx = x + vx * dt;
  const ny = y + vy * dt;
  // F
  // [1 0 dt 0]
  // [0 1 0 dt]
  // [0 0 1  0]
  // [0 0 0  1]
  const F: Mat4 = [1, 0, dt, 0,
                   0, 1, 0, dt,
                   0, 0, 1, 0,
                   0, 0, 0, 1];
  // P = F P F^T + Q
  const P = state.P;
  const FP = multiply4x4(F, P);
  const Ft = transpose4(F);
  let Pn = multiply4x4(FP, Ft);
  const q = state.q;
  const dt2 = dt * dt;
  // Simple process noise
  const Q: Mat4 = [q*dt2, 0, 0, 0,
                   0, q*dt2, 0, 0,
                   0, 0, q, 0,
                   0, 0, 0, q];
  Pn = add4x4(Pn, Q);
  state.x = [nx, ny, vx, vy];
  state.P = Pn;
}

export function kalmanUpdate(state: Kalman2DState, z: { x: number; y: number }, rMeas?: number) {
  // H maps state -> position
  const H = [1, 0, 0, 0,
             0, 1, 0, 0]; // 2x4
  const P = state.P;
  const HP = multiply2x4x4(H, P); // 2x4
  const Ht = transpose2x4(H); // 4x2
  const S2 = add2x2(multiply2x4x4_to2x2(HP, Ht), measNoise2(rMeas ?? state.rBase)); // 2x2
  const K = multiply4x2x2(P, Ht, invert2x2(S2)); // 4x2
  const hx = state.x[0];
  const hy = state.x[1];
  const yv = [z.x - hx, z.y - hy] as [number, number];
  const K_y = multiply4x2_vec(K, yv);
  state.x = [
    state.x[0] + K_y[0],
    state.x[1] + K_y[1],
    state.x[2] + K_y[2],
    state.x[3] + K_y[3],
  ];
  // P = (I - K H) P
  const KH = multiply4x2x4(K, H);
  const I = mat4Identity();
  const IminusKH = sub4x4(I, KH);
  state.P = multiply4x4(IminusKH, P);
}

export function kalmanInit(state: Kalman2DState, z: { x: number; y: number }) {
  state.x = [z.x, z.y, 0, 0];
  state.P = mat4Identity();
  state.initialized = true;
}

function multiply4x4(a: Mat4, b: Mat4): Mat4 {
  const r: number[] = new Array(16).fill(0);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += a[i*4+k] * b[k*4+j];
      r[i*4+j] = sum;
    }
  }
  return r as Mat4;
}

function transpose4(a: Mat4): Mat4 {
  const r: number[] = new Array(16).fill(0);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) r[i*4+j] = a[j*4+i];
  return r as Mat4;
}

function add4x4(a: Mat4, b: Mat4): Mat4 {
  const r: number[] = new Array(16);
  for (let i = 0; i < 16; i++) r[i] = a[i] + b[i];
  return r as Mat4;
}

function sub4x4(a: Mat4, b: Mat4): Mat4 {
  const r: number[] = new Array(16);
  for (let i = 0; i < 16; i++) r[i] = a[i] - b[i];
  return r as Mat4;
}

function multiply2x4x4(H: number[], P: Mat4): number[] {
  // 2x4 * 4x4 -> 2x4
  const r = new Array(8).fill(0);
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 4; j++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += H[i*4+k] * P[k*4+j];
      r[i*4+j] = sum;
    }
  }
  return r;
}

function transpose2x4(H: number[]): number[] {
  // 2x4 -> 4x2
  const r = new Array(8).fill(0);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 4; j++) r[j*2+i] = H[i*4+j];
  return r;
}

function multiply2x4x4_to2x2(A2x4: number[], Bt4x2: number[]): Mat2 {
  // (2x4) * (4x2) -> 2x2
  const r = [0, 0, 0, 0];
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += A2x4[i*4+k] * Bt4x2[k*2+j];
      r[i*2+j] = sum;
    }
  }
  return r as Mat2;
}

function invert2x2(m: Mat2): Mat2 {
  const [a, b, c, d] = m;
  const det = a * d - b * c || 1e-6;
  const inv = [d / det, -b / det, -c / det, a / det] as Mat2;
  return inv;
}

function add2x2(a: Mat2, b: Mat2): Mat2 {
  return [a[0]+b[0], a[1]+b[1], a[2]+b[2], a[3]+b[3]] as Mat2;
}

// placeholder removed

function multiply4x2x2_impl(A4x2: number[], invS: Mat2): number[] {
  const r = new Array(8).fill(0);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 2; j++) {
      r[i*2+j] = A4x2[i*2+0]*invS[0*2+j] + A4x2[i*2+1]*invS[1*2+j];
    }
  }
  return r;
}

function multiply4x2x2(A4x4: Mat4, Ht4x2: number[], invS: Mat2): number[] {
  // K = P H^T S^{-1}
  const PHt = multiply4x4x4x2(A4x4, Ht4x2);
  return multiply4x2x2_impl(PHt, invS);
}

function multiply4x4x4x2(P: Mat4, Ht4x2: number[]): number[] {
  // 4x4 * 4x2 -> 4x2
  const r = new Array(8).fill(0);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 2; j++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += P[i*4+k] * Ht4x2[k*2+j];
      r[i*2+j] = sum;
    }
  }
  return r;
}

function multiply4x2_vec(K4x2: number[], v2: [number, number]): [number, number, number, number] {
  const r: [number, number, number, number] = [0, 0, 0, 0];
  for (let i = 0; i < 4; i++) {
    r[i] = K4x2[i*2+0]*v2[0] + K4x2[i*2+1]*v2[1];
  }
  return r;
}

function measNoise2(r: number): Mat2 {
  return [r*r, 0, 0, r*r];
}
