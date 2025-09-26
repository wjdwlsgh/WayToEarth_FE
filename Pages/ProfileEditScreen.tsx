// screens/ProfileEditScreen.js
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { client } from "../utils/api/client";
import { checkNickname, getMyProfile } from "../utils/api/users";
// import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";

export default function ProfileEditScreen({ navigation }: { navigation: any }) {
  // form state
  const [nickname, setNickname] = useState("");
  const [originalNickname, setOriginalNickname] = useState(""); // ✅ 원래 닉네임 보관
  const [residence, setResidence] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState(""); // 문자열로 관리 후 전송 시 숫자화
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [profileImageKey, setProfileImageKey] = useState<string | null>(null);

  // ui state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 닉네임 중복 체크 (별도 저장 플로우)
  const [nicknameChecking, setNicknameChecking] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [nicknameSaving, setNicknameSaving] = useState(false); // ✅ 닉네임만 저장 상태
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 초기값 로드
  const loadMe = useCallback(async () => {
    try {
      setLoading(true);
      const me = await getMyProfile();
      const nk = (me as any)?.nickname ?? "";
      setNickname(nk);
      setOriginalNickname(nk); // ✅ 원본 셋
      setResidence((me as any)?.residence ?? "");
      setWeeklyGoal(
        (me as any)?.weekly_goal_distance != null
          ? String((me as any).weekly_goal_distance)
          : ""
      );
      setProfileImageUrl(
        (me as any)?.profileImageUrl ?? (me as any)?.profile_image_url ?? ""
      );
      setProfileImageKey((me as any)?.profile_image_key ?? null);
      setNicknameError(null);
    } catch (e) {
      console.warn(e);
      Alert.alert("오류", "내 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  // 닉네임 중복 확인 (디바운스 400ms) — ✅ 원래 닉네임과 다를 때만 검사
  useEffect(() => {
    const trimmed = nickname?.trim() || "";
    if (!trimmed || trimmed === originalNickname) {
      // 비어있거나 변경 없음 → 오류 초기화 & 검사 안 함
      setNicknameError(null);
      setNicknameChecking(false);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setNicknameChecking(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await checkNickname(trimmed);
        setNicknameError(res.isDuplicate ? "이미 사용 중인 닉네임입니다." : null);
      } catch {
        // API 실패 시 저장을 막지 않도록 오류표시는 하지 않음
        setNicknameError(null);
      } finally {
        setNicknameChecking(false);
      }
    }, 400);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [nickname, originalNickname]);

  // 저장 가능 여부 (✅ 닉네임 오류와 무관 — 닉네임은 별도 버튼으로 저장)
  const canSaveProfile = useMemo(() => {
    if (loading || saving || uploading) return false;
    return true;
  }, [loading, saving, uploading]);

  // 닉네임 변경 버튼 활성 조건
  const canChangeNickname = useMemo(() => {
    const trimmed = nickname?.trim() || "";
    if (nicknameSaving || nicknameChecking) return false;
    if (!trimmed) return false;
    if (trimmed === originalNickname) return false; // 변경 없음
    if (nicknameError) return false; // 중복/오류 시 비활성
    return true;
  }, [
    nickname,
    originalNickname,
    nicknameError,
    nicknameSaving,
    nicknameChecking,
  ]);

  // S3 업로드용: MIME 추론
  const guessMime = (nameOrUri: string) => {
    const ext = (nameOrUri?.split(".").pop() || "").toLowerCase();
    if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
    if (ext === "png") return "image/png";
    if (ext === "webp") return "image/webp";
    return "image/jpeg";
  };

  // 프로필 사진 변경 (선택 → presign → S3 PUT → DB 저장)
  const onChangePhoto = useCallback(async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("권한 필요", "사진 접근 권한이 필요합니다.");
        return;
      }

      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
      });
      if (picked.canceled) return;

      const asset = picked.assets[0];
      const fileUri = asset.uri; // file://...
      const fileName = fileUri.split("/").pop() || "profile.jpg";
      const info = await FileSystem.getInfoAsync(fileUri);
      if (!info.exists || info.isDirectory) {
        Alert.alert("오류", "파일을 찾을 수 없거나 폴더입니다.");
        return;
      }
      const size = typeof (info as any).size === "number" ? (info as any).size : 0;
      const contentType = guessMime(fileName);

      if (size <= 0) {
        Alert.alert("오류", "파일 크기를 확인할 수 없습니다.");
        return;
      }
      if (size > 5 * 1024 * 1024) {
        Alert.alert("용량 초과", "최대 5MB까지 업로드할 수 있습니다.");
        return;
      }

      // presign 요청
      const { data } = await client.post("/v1/files/presign/profile", {
        fileName,
        contentType,
        size,
      });
      console.log("[presign response]", data);

      // 서버 응답: upload_url / download_url(public_url 호환) 대응
      const signedUrl =
        data?.upload_url ??
        data?.signed_url ??
        data?.signedUrl ??
        data?.uploadUrl;
      const downloadUrl =
        data?.download_url ?? data?.public_url ?? data?.downloadUrl ?? data?.publicUrl;
      const key = data?.key ?? data?.file_key ?? data?.fileKey;

      if (!signedUrl || !downloadUrl) {
        Alert.alert("오류", "업로드 URL 발급에 실패했습니다.");
        return;
      }

      setUploading(true);

      // S3 업로드 (PUT)
      const resUpload = await FileSystem.uploadAsync(signedUrl, fileUri, {
        httpMethod: "PUT",
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(size),
        },
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      });
      if (!(resUpload.status === 200 || resUpload.status === 204)) {
        throw new Error(`S3 업로드 실패: ${resUpload.status}`);
      }

      // DB 저장 (URL + KEY 모두 전달: 서버가 key 기준 저장 시 호환)
      await client.put("/v1/users/me", {
        profile_image_url: downloadUrl,
        ...(key ? { profile_image_key: key } : {}),
      });
      setProfileImageUrl(downloadUrl);
      if (key) setProfileImageKey(key);
      setShowSuccessMessage("프로필 사진이 변경되었습니다");
      setTimeout(() => setShowSuccessMessage(null), 3000);
      // 내정보 화면이 즉시 반영되도록 파라미터로 최신 URL 전달
      try {
        navigation.navigate("Profile", { avatarUrl: downloadUrl, cacheBust: Date.now() });
      } catch {}
    } catch (e: any) {
      console.warn(e);
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "이미지 업로드에 실패했습니다.";
      Alert.alert("오류", msg);
    } finally {
      setUploading(false);
    }
  }, []);

  // 닉네임만 별도로 저장
  const onChangeNickname = useCallback(async () => {
    try {
      if (!canChangeNickname) return;
      setNicknameSaving(true);
      const trimmed = nickname.trim();
      await client.put("/v1/users/me", { nickname: trimmed });
      setOriginalNickname(trimmed); // ✅ 원본 갱신
      setNicknameError(null);
      setShowSuccessMessage("닉네임이 변경되었습니다");
      setTimeout(() => setShowSuccessMessage(null), 3000);
    } catch (e: any) {
      console.warn(e);
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "닉네임 변경에 실패했습니다.";
      Alert.alert("오류", msg);
    } finally {
      setNicknameSaving(false);
    }
  }, [canChangeNickname, nickname]);

  // 나머지 필드 저장 (닉네임 제외)
  const onSaveProfile = useCallback(async () => {
    if (!canSaveProfile) return;
    try {
      setSaving(true);
      const weeklyGoalNumber =
        weeklyGoal?.trim() === "" ? undefined : Number(weeklyGoal);

      const payload = {
        // nickname 제외 ✅ (닉네임은 onChangeNickname 경로)
        residence: residence?.trim() || undefined,
        // 서버 스펙: snake_case 사용
        profile_image_url: profileImageUrl?.trim() || undefined,
        ...(profileImageKey ? { profile_image_key: profileImageKey } : {}),
        weekly_goal_distance:
          typeof weeklyGoalNumber === "number" &&
          !Number.isNaN(weeklyGoalNumber)
            ? weeklyGoalNumber
            : undefined,
      };

      await client.put("/v1/users/me", payload);
      setShowSuccessMessage("프로필이 수정되었습니다");
      await loadMe();
      // 저장 후 이전 화면으로 복귀하면 focus에서 재조회
      setTimeout(() => {
        setShowSuccessMessage(null);
        navigation?.goBack?.();
      }, 1500);
    } catch (e: any) {
      console.warn(e);
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "프로필 수정에 실패했습니다.";
      Alert.alert("오류", msg);
    } finally {
      setSaving(false);
    }
  }, [canSaveProfile, residence, profileImageUrl, weeklyGoal, loadMe]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { flex: 1, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>불러오는 중…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 상태바 (디자인용) */}
      <View style={styles.statusBar}>
        <View style={styles.statusFrame}>
          <View style={styles.time}>
            <Text style={styles.timeText}>9:41</Text>
          </View>
          <View style={styles.dynamicIsland} />
          <View className="levels" style={styles.levels}>
            <Image
              source={require("../assets/cellular-connection0.png")}
              style={styles.icon}
            />
            <Image
              source={require("../assets/wifi0.png")}
              style={styles.icon}
            />
            <Image
              source={require("../assets/battery0.png")}
              style={styles.icon}
            />
          </View>
        </View>
      </View>

      {/* 모던한 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>기본 정보 관리</Text>
      </View>

      {/* 본문 */}
      <View style={styles.main}>
        <Text style={styles.title}>프로필 정보를 수정하세요</Text>
        <Text style={styles.subtitle}>
          러닝을 시작하기 위한 기본 정보를 업데이트해주세요
        </Text>

        {/* 프로필 사진 */}
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImage}>
            {profileImageUrl ? (
              <Image
                source={{ uri: profileImageUrl }}
                style={{ width: 92, height: 92, borderRadius: 46 }}
              />
            ) : (
              <Text style={styles.profileIcon}>🏃</Text>
            )}
          </View>
          <TouchableOpacity onPress={onChangePhoto} disabled={uploading}>
            <Text style={[styles.changePhoto, uploading && { opacity: 0.6 }]}>
              {uploading ? "업로드 중..." : "프로필 사진 변경"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 닉네임 (별도 변경 버튼) */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>닉네임</Text>
          <View style={styles.nicknameRow}>
            <View style={[styles.input, styles.nicknameInput]}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder="닉네임을 입력하세요"
                  placeholderTextColor="#94a3b8"
                  value={nickname}
                  onChangeText={setNickname}
                  autoCapitalize="none"
                  maxLength={20}
                />
                {nicknameChecking && (
                  <ActivityIndicator style={{ marginLeft: 8 }} color="#6366f1" />
                )}
              </View>
            </View>

            <TouchableOpacity
              onPress={onChangeNickname}
              disabled={!canChangeNickname}
              style={[
                styles.nickChangeBtn,
                !canChangeNickname && { opacity: 0.5 },
              ]}
            >
              {nicknameSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.nickChangeBtnText}>변경</Text>
              )}
            </TouchableOpacity>
          </View>

          {nicknameError && (
            <Text style={styles.errorText}>{nicknameError}</Text>
          )}
          {!nicknameError && nickname.trim() && nickname.trim() !== originalNickname && !nicknameChecking && (
            <Text style={styles.successText}>사용 가능한 닉네임입니다</Text>
          )}
        </View>

        {/* 거주 지역 */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>거주 지역</Text>
          <View style={styles.input}>
            <TextInput
              style={styles.textInput}
              placeholder="예) 강원도 춘천시"
              placeholderTextColor="rgba(68,68,68,0.27)"
              value={residence}
              onChangeText={setResidence}
            />
          </View>
        </View>

        {/* 주간 목표 거리 */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>주간 목표 거리 (km)</Text>
          <View style={styles.input}>
            <TextInput
              style={styles.textInput}
              placeholder="예) 25"
              placeholderTextColor="rgba(68,68,68,0.27)"
              value={weeklyGoal}
              onChangeText={(v) => setWeeklyGoal(v.replace(/[^\d]/g, ""))} // 숫자만
              keyboardType="number-pad"
              inputMode="numeric"
              maxLength={4}
            />
          </View>
        </View>

        {/* 프로필 이미지 URL (선택) */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>프로필 이미지 URL (선택)</Text>
          <View style={styles.input}>
            <TextInput
              style={styles.textInput}
              placeholder="https://…"
              placeholderTextColor="rgba(68,68,68,0.27)"
              value={profileImageUrl}
              onChangeText={setProfileImageUrl}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* 저장 버튼 (닉네임 제외) */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            !canSaveProfile && styles.saveButtonDisabled,
          ]}
          disabled={!canSaveProfile}
          onPress={onSaveProfile}
        >
          {saving || uploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>변경사항 저장</Text>
          )}
        </TouchableOpacity>

        {/* 취소 버튼 */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation?.goBack?.()}
        >
          <Text style={styles.cancelButtonText}>취소</Text>
        </TouchableOpacity>
      </View>

      {/* 성공 메시지 토스트 */}
      {showSuccessMessage && (
        <View style={styles.successToast}>
          <View style={styles.successToastContent}>
            <Text style={styles.successToastIcon}>✅</Text>
            <Text style={styles.successToastText}>{showSuccessMessage}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8fafc",
    paddingBottom: 30,
    flex: 1,
  },

  // 상태바 제거하고 더 깔끔한 디자인으로
  statusBar: {
    backgroundColor: "#fff",
    paddingTop: 21,
    height: 51,
    alignItems: "center",
  },
  statusFrame: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: 268,
  },
  time: { paddingHorizontal: 16 },
  timeText: { fontSize: 17, fontWeight: "600", color: "#000" },
  dynamicIsland: { width: 124, height: 10 },
  levels: { flexDirection: "row", gap: 7, paddingHorizontal: 6 },
  icon: { width: 20, height: 13, resizeMode: "contain" },

  // 모던한 헤더
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 90,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    fontSize: 20,
    color: "#6366f1",
    fontWeight: "700",
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    letterSpacing: -0.3,
  },

  // 메인 콘텐츠
  main: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1e293b",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748b",
    lineHeight: 22,
    marginBottom: 24,
  },

  // 프로필 이미지
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  profileImage: {
    backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 3,
    borderColor: "#fff",
    marginBottom: 12,
  },
  profileIcon: { fontSize: 30, color: "#fff" },
  changePhoto: {
    fontSize: 15,
    color: "#6366f1",
    fontWeight: "600",
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderRadius: 20,
    overflow: "hidden",
  },

  // 폼 그룹
  formGroup: { marginBottom: 20 },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 18,
    height: 52,
    justifyContent: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
  },
  inputFocused: {
    borderColor: "#6366f1",
    borderWidth: 2,
  },
  textInput: {
    fontSize: 16,
    color: "#1e293b",
    paddingVertical: 8,
    fontWeight: "500",
  },

  // 닉네임 변경 버튼 - 더 모던한 디자인
  nicknameRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-end",
  },
  nicknameInput: {
    flex: 1,
  },
  nickChangeBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  nickChangeBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // 에러 메시지
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
    paddingLeft: 4,
  },
  successText: {
    color: "#10b981",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
    paddingLeft: 4,
  },

  // 저장 버튼
  saveButton: {
    backgroundColor: "#6366f1",
    borderRadius: 14,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: "#94a3b8",
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // 취소 버튼
  cancelButton: {
    backgroundColor: "transparent",
    borderRadius: 16,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  cancelButtonText: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "600",
  },

  // 성공 토스트
  successToast: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  successToastContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  successToastIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  successToastText: {
    color: "#1e293b",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
});
