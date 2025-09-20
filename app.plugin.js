// app.plugin.js
const {
  withAndroidManifest,
  withStringsXml,
  withProjectBuildGradle,
  createRunOncePlugin,
} = require("expo/config-plugins");

const PLUGIN_NAME = "withKakaoLogin";
const KAKAO_MAVEN_URL =
  "https://devrepo.kakao.com/nexus/content/groups/public/";

function addKakaoMaven(buildGradle) {
  if (!buildGradle.includes(KAKAO_MAVEN_URL)) {
    return buildGradle.replace(
      /repositories\s*{/,
      (m) => `${m}\n        maven { url '${KAKAO_MAVEN_URL}' }`
    );
  }
  return buildGradle;
}

const withKakaoProjectBuildGradle = (config) =>
  withProjectBuildGradle(config, (cfg) => {
    cfg.modResults.contents = addKakaoMaven(cfg.modResults.contents);
    return cfg;
  });

const withKakaoStrings = (config, appKey) =>
  withStringsXml(config, (cfg) => {
    const items = cfg.modResults.resources?.string ?? [];
    const hasKey = items.some((s) => s.$?.name === "kakao_app_key");
    if (!hasKey) {
      items.push({ _: appKey, $: { name: "kakao_app_key" } });
    }
    cfg.modResults.resources = cfg.modResults.resources || {};
    cfg.modResults.resources.string = items;
    return cfg;
  });

const withKakaoManifest = (config) =>
  withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (!app) return cfg;

    // meta-data: com.kakao.sdk.AppKey -> @string/kakao_app_key
    app["meta-data"] = app["meta-data"] || [];
    const hasMeta = app["meta-data"].some(
      (m) => m.$["android:name"] === "com.kakao.sdk.AppKey"
    );
    if (!hasMeta) {
      app["meta-data"].push({
        $: {
          "android:name": "com.kakao.sdk.AppKey",
          "android:value": "@string/kakao_app_key",
        },
      });
    }

    // KakaoTalk 패키지 조회 허용 (Android 11+ queries)
    cfg.modResults.manifest.queries = cfg.modResults.manifest.queries || [];
    const queries = cfg.modResults.manifest.queries;
    const hasQuery = queries.some(
      (q) =>
        q.package &&
        q.package.some((p) => p.$["android:name"] === "com.kakao.talk")
    );
    if (!hasQuery) {
      queries.push({
        package: [{ $: { "android:name": "com.kakao.talk" } }],
      });
    }

    return cfg;
  });

const withKakao = (config, { kakaoAppKey }) => {
  if (!kakaoAppKey) {
    throw new Error(
      "[withKakaoLogin] kakaoAppKey가 없습니다. app.json의 extra.kakaoAppKey에 값을 넣어주세요."
    );
  }
  config = withKakaoProjectBuildGradle(config);
  config = withKakaoStrings(config, kakaoAppKey);
  config = withKakaoManifest(config);
  return config;
};

module.exports = createRunOncePlugin(withKakao, PLUGIN_NAME, "1.0.0");
