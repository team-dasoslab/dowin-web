import type { Locale } from "@/i18n/detect-locale";

type LegalDocumentSection = {
  heading: string;
  body: string[];
};

type LegalDocumentContent = {
  title: string;
  subtitle: string;
  effectiveDateLabel: string;
  effectiveDate: string;
  sections: LegalDocumentSection[];
  footnote: string;
};

const privacyByLocale: Record<Locale, LegalDocumentContent> = {
  ko: {
    title: "개인정보처리방침",
    subtitle:
      "Dasoslab(이하 '회사')는 Dowin 서비스(이하 '서비스') 제공 과정에서 필요한 최소한의 개인정보를 처리합니다.\n본 방침은 현재 공개 중인 서비스 기준으로 적용되며, 처리 항목 또는 외부 연동이 변경되면 업데이트됩니다.",
    effectiveDateLabel: "시행일",
    effectiveDate: "2026.04.28",
    footnote:
      "본 방침은 Dowin 웹 서비스 및 이에 연결된 인증, 결제, 푸시 알림, 문의 접수 흐름에 적용됩니다. 법령 또는 실제 운영 방식이 변경되면 본 문서를 함께 갱신합니다.",
    sections: [
      {
        heading: "1. 총칙",
        body: [
          "Dasoslab(이하 '회사')는 Dowin 서비스(이하 '서비스')를 운영합니다.",
          "본 개인정보처리방침은 서비스와 이에 연결된 계정, 기록, 알림, 결제, 문의 접수 흐름에 적용됩니다.",
          "회사는 관련 법령에 따라 이용자의 개인정보를 보호하고, 필요한 범위에서 최소한의 정보만 처리하기 위해 노력합니다.",
        ],
      },
      {
        heading: "2. 개인정보처리자 및 문의처",
        body: [
          "개인정보 보호에 대한 문의 사항은 아래 연락처로 문의하실 수 있습니다.",
          "책임자명: Dowin 개인정보보호 담당자",
          "이메일: dowin.support@dasoslab.com",
        ],
      },
      {
        heading: "3. 수집·처리하는 개인정보 항목",
        body: [
          "회원가입 및 인증 과정에서 아이디(customId), 닉네임, 비밀번호 해시, 세션 식별자, 복원코드 해시를 처리합니다.",
          "서비스 이용 과정에서 워크스페이스 정보, 점수판, 선행지표, 일일 기록, 팀 메모, 프로필 설정(아바타, 언어), 알림 설정, 앱 푸시 토큰(FCM) 정보를 처리합니다.",
          "유료 기능 이용 시 워크스페이스 플랜 상태, 결제 이벤트, checkout 요청 이력, provider가 전달한 고객 또는 구독 식별자를 처리할 수 있습니다.",
          "서비스 이용 분석 과정에서 Google Analytics를 통해 접속 기기 정보, 페이지 이동, 기능 사용 이벤트 등 온라인 식별 정보와 이벤트 로그가 처리될 수 있습니다.",
        ],
      },
      {
        heading: "4. 개인정보의 처리 목적",
        body: [
          "계정 생성, 본인 식별, 로그인 유지, 비밀번호 재설정, 부정 이용 방지 등 인증 기능 제공을 위해 개인정보를 처리합니다.",
          "워크스페이스 운영, 점수판 및 기록 저장, 알림 발송, 프로필 관리, 문의 대응, 장애 분석 및 서비스 안정성 확보를 위해 개인정보를 처리합니다.",
          "유료 플랜 제공, 결제 상태 확인, 환불 또는 취소 대응, 부정 결제 또는 반복 환불 패턴 검토를 위해 필요한 범위의 결제 관련 정보를 처리합니다.",
          "제품 사용성 개선과 운영 지표 확인을 위해 기능 사용 이벤트를 분석할 수 있으며, 자유 메모 본문이나 비밀번호 같은 민감한 내용을 광고 목적 분석 도구로 전송하지 않습니다.",
        ],
      },
      {
        heading: "5. 개인정보의 보유 및 이용기간",
        body: [
          "회원 계정 정보(customId, 닉네임, 비밀번호 해시)는 회원 탈퇴 시까지 보유합니다.",
          "세션 정보(dowin_sid에 대응되는 세션 식별자)는 로그인 유지에 필요한 기간 동안 보유하며, 만료 또는 로그아웃 후에는 더 이상 사용하지 않습니다.",
          "복원코드 해시는 계정 복구 기능 제공을 위해 보유하며, 계정이 삭제되거나 복구 수단으로 더 이상 필요하지 않게 되면 삭제 또는 비활성화합니다.",
          "워크스페이스, 점수판, 선행지표, 일일 기록, 팀 메모, 프로필 설정, 알림 설정 등 사용자 작성 데이터는 회원 탈퇴 시까지 보유합니다.",
          "앱 푸시 토큰(FCM)은 이용자가 알림을 해제하거나 해당 토큰이 만료·무효화될 때까지 보유합니다.",
          "Google Analytics를 통해 처리되는 온라인 식별자와 이벤트 로그는 회사의 Analytics 속성 설정 및 Google 정책에 따라 보관되거나 삭제될 수 있습니다.",
          "결제 관련 식별자, 결제 이벤트, checkout 요청 이력은 정산, 환불, 분쟁 대응, 부정 결제 확인에 필요한 기간 동안 보유할 수 있습니다.",
          "문의 접수 내역은 일반 문의 대응을 위해 처리 완료 후 12개월간 보유할 수 있습니다. 다만 결제, 환불, 계약 해지, 서비스 이용 관련 소비자 불만 또는 분쟁 처리에 해당하는 경우에는 관련 법령에 따라 3년간 보유할 수 있습니다.",
          "회원 탈퇴 시 사용자 계정과 이에 직접 연결된 데이터는 삭제를 원칙으로 합니다. 다만 관련 법령 준수, 분쟁 대응, 정산·환불 확인, 보안 감사 등 정당한 사유가 있는 정보는 필요한 범위에서 별도 분리 보관할 수 있습니다.",
        ],
      },
      {
        heading: "6. 개인정보의 제3자 제공",
        body: [
          "회사는 이용자의 개인정보를 판매하지 않으며, 법령상 근거가 있거나 이용자 동의가 있는 경우를 제외하고 개인정보를 제3자에게 제공하지 않습니다.",
        ],
      },
      {
        heading: "7. 개인정보 처리위탁 및 외부 서비스 이용",
        body: [
          "회사는 서비스 운영을 위해 외부 서비스를 이용할 수 있으며, 각 서비스는 해당 기능 수행에 필요한 범위에서만 관여합니다.",
          "Cloudflare는 애플리케이션 인프라, 보안, 데이터베이스 운영을 위해 사용될 수 있으며, 서비스 접속 및 저장 과정에서 계정 정보, 서비스 내 작성 데이터, 접속 관련 기술 정보가 처리될 수 있습니다.",
          "Google Analytics는 서비스 이용 통계와 기능 사용 분석을 위해 사용될 수 있으며, 온라인 식별자, 접속 기기 정보, 페이지 이동, 기능 사용 이벤트가 처리될 수 있습니다. 회사는 자유 메모 본문이나 비밀번호 같은 민감한 내용을 분석 도구로 전송하지 않도록 운영합니다.",
          "Polar는 유료 플랜 결제 처리, 정기결제 관리, 고객 포털 제공을 위해 사용될 수 있으며, 결제 관련 고객 식별자, 구독 식별자, 결제 상태 정보, checkout 요청 이력이 처리될 수 있습니다.",
          "Tally는 문의 접수 창구 제공을 위해 사용될 수 있으며, 이용자가 문의 과정에서 직접 입력한 이름, 이메일, 문의 내용, 첨부 정보가 처리될 수 있습니다. 회사는 문의 응답 데이터의 처리 목적과 항목을 정하고, Tally는 문의 폼 제공과 응답 저장을 위한 외부 서비스로 사용됩니다.",
        ],
      },
      {
        heading: "8. 개인정보의 국외 이전 가능성",
        body: [
          "회사가 이용하는 외부 서비스 중 일부는 대한민국 외 지역에 인프라 또는 서버를 둘 수 있으며, 그 과정에서 개인정보가 국외에서 처리되거나 저장될 수 있습니다.",
          "Cloudflare는 글로벌 인프라를 통해 서비스 트래픽과 저장 데이터를 처리할 수 있으므로, 서비스 접속 및 저장 과정에서 계정 정보, 서비스 내 작성 데이터, 접속 관련 기술 정보가 국외에서 처리될 수 있습니다.",
          "Google Analytics는 Google의 글로벌 인프라를 통해 온라인 식별자, 접속 기기 정보, 페이지 이동, 기능 사용 이벤트를 국외에서 처리할 수 있습니다.",
          "Polar는 결제 처리와 고객 포털 제공 과정에서 결제 관련 고객 식별자, 구독 식별자, 결제 상태 정보, checkout 요청 이력을 국외에서 처리할 수 있습니다.",
          "Tally 문의 폼을 통해 제출된 이름, 이메일, 문의 내용, 첨부 정보는 문의 폼 제출 시 정보통신망을 통해 국외에서 처리·저장될 수 있습니다. Tally는 공식 안내상 폼 응답 데이터를 Europe에 저장한다고 설명하고 있습니다.",
          "Tally 문의 데이터의 보유기간은 일반 문의의 경우 처리 완료 후 12개월, 결제·환불·계약 관련 소비자 불만 또는 분쟁 문의의 경우 관련 법령에 따라 3년입니다.",
          "국외 이전 또는 국외 처리의 정확한 지역, 이전 시점, 저장 기간은 각 사업자의 글로벌 인프라 운영 방식과 회사의 기능 설정에 따라 달라질 수 있습니다.",
          "회사는 서비스 제공, 보안, 결제, 문의 대응, 이용 통계 분석에 필요한 범위에서만 이러한 외부 서비스를 사용하며, 관련 법령이 요구하는 경우 추가 고지 또는 별도 동의 절차를 검토합니다.",
        ],
      },
      {
        heading: "9. 개인정보의 파기 절차 및 방법",
        body: [
          "개인정보는 처리 목적이 달성되거나 보유 기간이 끝나면 복구 또는 법적 보존 필요성을 검토한 후 삭제 또는 더 이상 개인을 식별할 수 없는 방식으로 처리합니다.",
          "전자적 파일 형태의 정보는 서비스 DB와 연결 저장소에서 삭제하며, 별도 보관이 필요한 경우 접근 권한을 제한한 상태로 분리 관리합니다.",
        ],
      },
      {
        heading: "10. 이용자의 권리와 행사 방법",
        body: [
          "이용자는 자신의 개인정보에 대해 열람, 정정, 삭제, 처리정지 요청을 할 수 있습니다.",
          "프로필 수정, 언어 변경, 워크스페이스 탈퇴, 계정 탈퇴 등 일부 권리는 서비스 내 기능으로 직접 행사할 수 있으며, 추가 요청은 서비스 내 문의하기 링크 또는 이메일(dowin.support@dasoslab.com)로 접수할 수 있습니다.",
          "서비스 내 문의하기는 현재 외부 문의 폼(Tally, https://tally.so/r/2ExbKb)으로 연결될 수 있으므로, 이용자는 주민등록번호, 계좌번호, 비밀번호, 건강정보 등 민감한 개인정보 입력을 피하고 필요한 범위의 정보만 기재해 주시기 바랍니다.",
          "탈퇴 시 현재 비밀번호 확인이 요구될 수 있으며, 워크스페이스의 유일한 관리자인 경우 권한 이전 또는 워크스페이스 삭제가 먼저 필요할 수 있습니다.",
        ],
      },
      {
        heading: "11. 쿠키 및 온라인 식별자",
        body: [
          "회사는 로그인 유지와 언어 설정을 위해 쿠키를 사용할 수 있습니다. 대표적으로 세션 쿠키(dowin_sid)와 언어 설정 쿠키(NEXT_LOCALE)가 사용됩니다.",
          "Google Analytics 등 분석 도구 사용 과정에서 쿠키 또는 온라인 식별자가 사용될 수 있습니다.",
          "이용자는 브라우저 설정을 통해 쿠키 저장을 거부하거나 이미 저장된 쿠키를 삭제할 수 있습니다. 다만 이 경우 로그인 유지, 언어 설정 저장, 일부 분석 기반 기능 개선이 정상적으로 동작하지 않을 수 있습니다.",
          "Google Analytics의 수집을 원하지 않는 경우 브라우저 설정, 쿠키 차단 기능, 또는 Google이 제공하는 차단 도구를 이용할 수 있습니다.",
        ],
      },
      {
        heading: "12. 개인정보 보호를 위한 노력",
        body: [
          "비밀번호는 해시 형태로 저장되며, 접근 통제, 최소 권한 부여, HTTPS 기반 전송, 운영 로그 분리 등 합리적인 보호조치를 적용하기 위해 노력합니다.",
        ],
      },
      {
        heading: "13. 권익침해 구제 방법",
        body: [
          "이용자는 개인정보 침해에 대한 신고나 상담이 필요한 경우 개인정보보호위원회, 개인정보침해신고센터, 개인정보 분쟁조정위원회 등 관련 기관의 도움을 받을 수 있습니다.",
          "회사는 접수된 문의와 침해 신고에 대해 확인 가능한 범위에서 신속히 응답하도록 노력합니다.",
        ],
      },
      {
        heading: "14. 개인정보처리방침의 변경",
        body: [
          "본 개인정보처리방침은 관련 법령, 서비스 기능, 외부 연동 방식이 변경되는 경우 함께 수정될 수 있습니다.",
          "중요한 변경이 있는 경우 서비스 화면 또는 공지사항을 통해 안내합니다.",
        ],
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    subtitle:
      "Dowin processes the minimum personal information needed to provide the service.\nThis policy reflects the currently published service and will be updated when processing details or third-party integrations change.",
    effectiveDateLabel: "Effective date",
    effectiveDate: "2026.04.28",
    footnote:
      "This policy applies to the Dowin web service and to connected authentication, billing, push-notification, and support flows. We update it when legal requirements or operating practices change.",
    sections: [
      {
        heading: "1. General",
        body: [
          "Dowin is a goal-management service operated by Dasoslab.",
          "This Privacy Policy applies to the Dowin web service and to connected account, logging, notification, billing, and support flows.",
          "We aim to protect user privacy under applicable law and to process only the minimum information needed to run the service.",
        ],
      },
      {
        heading: "2. Controller and contact channel",
        body: [
          "You can contact us about privacy matters through the following channel.",
          "Privacy contact: Dowin Privacy Manager",
          "Email: dowin.support@dasoslab.com",
        ],
      },
      {
        heading: "3. Categories of personal information we process",
        body: [
          "For sign-up and authentication, we process account ID (customId), nickname, password hash, session identifiers, and recovery-code hashes.",
          "During service use, we process workspace information, scoreboards, lead measures, daily logs, team memos, profile settings (avatar and locale), notification settings, and app push token data (FCM).",
          "When paid features are used, we may process workspace plan state, billing events, checkout request history, and customer or subscription identifiers provided by the payment provider.",
          "For product analytics, Google Analytics may process online identifiers and event logs such as device context, page views, and feature usage events.",
        ],
      },
      {
        heading: "4. Purpose of processing",
        body: [
          "We process personal information to create accounts, identify users, maintain login sessions, reset passwords, and prevent abuse.",
          "We also process personal information to operate workspaces, store scoreboards and logs, send notifications, manage profiles, respond to support requests, and keep the service stable.",
          "For paid plans, we process billing-related information to verify plan status, handle refunds or cancellations, and review suspicious payment or repeated refund patterns.",
          "We may analyze product-usage events to improve the service, but we do not intentionally send free-form memo content or passwords to analytics tools for advertising purposes.",
        ],
      },
      {
        heading: "5. Retention period",
        body: [
          "Account data such as customId, nickname, and password hash is retained until the account is deleted.",
          "Session data corresponding to the dowin_sid cookie is retained for the period needed to keep a user signed in and is no longer used after expiration or logout.",
          "Recovery-code hashes are retained to support account recovery and are deleted or disabled when the account is deleted or when they are no longer needed for recovery.",
          "User-generated data such as workspaces, scoreboards, lead measures, daily logs, team memos, profile settings, and notification settings is retained until the account is deleted.",
          "App push token data (FCM) is retained until the user disables notifications or the token expires or becomes invalid.",
          "Online identifiers and event logs processed through Google Analytics may be retained or deleted according to the company's Analytics property settings and Google's policies.",
          "Billing identifiers, billing events, and checkout request history may be retained for the period needed for settlement, refund handling, dispute response, or abuse review.",
          "Support-request records may be retained for 12 months after a general inquiry is resolved. Where the record relates to billing, refunds, termination, or a consumer complaint or dispute, it may be retained for 3 years as required by applicable law.",
          "When an account is deleted, we aim to delete the user account and directly linked data. Some data may still be retained separately where reasonably required by law, dispute handling, refund settlement, or security review.",
        ],
      },
      {
        heading: "6. Third-party disclosure",
        body: [
          "Dowin does not sell users' personal information and does not disclose it to third parties except where required by law or permitted by the user's consent.",
        ],
      },
      {
        heading: "7. Service providers and external services",
        body: [
          "We may rely on external services only to the extent needed to provide the relevant feature.",
          "Cloudflare may be used for application infrastructure, security, and database operation, and account data, user-generated service data, and technical access data may be processed in that context.",
          "Google Analytics may be used for usage analytics and may process online identifiers, device context, page transitions, and feature-usage events. We operate the service so that sensitive content such as free-form memo bodies or passwords is not intentionally sent to analytics tools.",
          "Polar may be used for paid-plan billing, recurring billing management, and customer-portal access, and billing-related customer identifiers, subscription identifiers, billing status, and checkout-request history may be processed in that context.",
          "Tally may be used to provide the support-intake form, and the user's name, email address, inquiry content, and attached information entered directly by the user may be processed for that purpose. Dowin determines the purpose and categories of inquiry data, and Tally is used as an external form and response-storage service.",
        ],
      },
      {
        heading: "8. Possible overseas processing or transfers",
        body: [
          "Some external services used by Dowin may operate infrastructure or servers outside the Republic of Korea, and personal information may therefore be processed or stored outside Korea.",
          "Cloudflare may process account data, user-generated service data, and technical access data outside Korea through its global infrastructure.",
          "Google Analytics may process online identifiers, device context, page transitions, and feature-usage events outside Korea through Google's global infrastructure.",
          "Polar may process billing-related customer identifiers, subscription identifiers, billing status, and checkout-request history outside Korea for payment processing and customer-portal access.",
          "Inquiry data submitted through the Tally form, including name, email address, inquiry content, and attachments, may be processed or stored outside Korea when the form is submitted. According to Tally's public guidance, form-response data is stored in Europe.",
          "For Tally inquiry data, general inquiries may be retained for 12 months after resolution, while billing, refund, termination, or consumer-dispute inquiries may be retained for 3 years where required by law.",
          "The exact processing region, transfer timing, and storage period can vary depending on each provider's global infrastructure and the way the service is configured.",
          "Where required by applicable law, we review whether additional notice or consent is needed for overseas processing or transfers.",
        ],
      },
      {
        heading: "9. Deletion procedure and method",
        body: [
          "When the purpose of processing ends or the retention period expires, we review any recovery or legal-retention need and then delete the data or handle it in a way that no longer identifies an individual.",
          "Electronic records are deleted from the service database and connected storage. Where separate retention is required, access is restricted and the data is handled separately.",
        ],
      },
      {
        heading: "10. User rights and how to exercise them",
        body: [
          "Users may request access, correction, deletion, or restriction of processing regarding their personal information.",
          "Some rights can be exercised directly through product features such as profile updates, locale changes, workspace leave, or account deletion. Additional requests can be sent through the in-product contact link or by email at dowin.support@dasoslab.com.",
          "The in-product contact path currently links to an external support form on Tally (https://tally.so/r/2ExbKb), so users should avoid entering unnecessary sensitive personal information such as resident registration numbers, bank-account details, passwords, or health information there.",
          "Account deletion may require current-password verification, and a sole workspace admin may need to transfer admin rights or delete the workspace first.",
        ],
      },
      {
        heading: "11. Cookies and online identifiers",
        body: [
          "Dowin may use cookies to keep users signed in and to remember locale settings. Typical examples include the session cookie (dowin_sid) and the locale-preference cookie (NEXT_LOCALE).",
          "Cookies or other online identifiers may also be used when analytics tools such as Google Analytics are enabled.",
          "Users can reject cookie storage or delete existing cookies through browser settings. If they do, login persistence, locale memory, or some analytics-based improvements may not work as intended.",
          "If users do not want Google Analytics collection, they may use browser privacy settings, cookie-blocking features, or tools provided by Google where available.",
        ],
      },
      {
        heading: "12. Security measures",
        body: [
          "Passwords are stored in hashed form. We also work to apply reasonable safeguards such as access control, least-privilege access, HTTPS-based transport, and separated operational logging.",
        ],
      },
      {
        heading: "13. Complaint and relief channels",
        body: [
          "Users may also seek help from the Personal Information Protection Commission or other relevant Korean privacy dispute and complaint channels when they believe their rights have been infringed.",
          "Dowin will make reasonable efforts to review submitted requests and respond promptly within the scope it can verify.",
        ],
      },
      {
        heading: "14. Changes to this Privacy Policy",
        body: [
          "This Privacy Policy may be updated when legal requirements, service features, or external integrations change.",
          "Where a material change occurs, we will notify users through the service or a posted notice.",
        ],
      },
    ],
  },
};

const termsByLocale: Record<Locale, LegalDocumentContent> = {
  ko: {
    title: "이용약관",
    subtitle:
      "본 약관은 Dasoslab(이하 '회사')가 운영하는 Dowin 서비스(이하 '서비스') 이용과 관련한 기본 조건을 정합니다.\n서비스 기능, 결제 방식, 운영 정책이 변경되면 관련 내용을 함께 갱신할 수 있습니다.",
    effectiveDateLabel: "시행일",
    effectiveDate: "2026.04.28",
    footnote:
      "본 약관은 웹 서비스 기준으로 적용됩니다. 개별 기능 화면, 결제 화면, 공지사항에 별도 조건이 표시되는 경우 그 조건이 함께 적용될 수 있습니다.",
    sections: [
      {
        heading: "1. 운영 주체 및 문의처",
        body: [
          "Dowin 서비스의 운영 주체는 Dasoslab이며, 대표자는 서한비입니다.",
          "사업자등록번호는 596-12-02628이고, 사업장 주소는 경기 화성시 동탄중심상가2길 8 4층입니다.",
          "서비스 관련 문의는 dowin.support@dasoslab.com으로 접수할 수 있습니다.",
        ],
      },
      {
        heading: "2. 목적 및 적용",
        body: [
          "회사는 개인 또는 팀이 중요한 목표를 설정하고, 선행지표를 기록하며, 주간 실행 흐름을 점수판 형태로 확인할 수 있도록 돕는 서비스를 제공합니다.",
          "본 약관은 회사가 제공하는 서비스의 웹 기능, 계정 기능, 워크스페이스 기능, 기록 기능, 알림 기능, 유료 플랜 기능 이용에 적용됩니다.",
        ],
      },
      {
        heading: "3. 회원가입 및 계정 관리",
        body: [
          "이용자는 서비스가 요구하는 방식에 따라 계정을 생성하고, 자신의 계정 정보와 접근 수단을 스스로 관리해야 합니다.",
          "비밀번호, 세션, 복원코드 등 계정 접근 수단의 관리 소홀로 발생한 문제에 대해서는 이용자 책임이 따를 수 있습니다.",
          "서비스는 보안상 필요하거나 비정상 이용이 의심되는 경우 본인 확인, 세션 종료, 접근 제한 등의 조치를 할 수 있습니다.",
        ],
      },
      {
        heading: "4. 이용자 데이터와 워크스페이스 운영",
        body: [
          "이용자는 자신이 입력하거나 업로드한 정보에 대한 책임을 부담하며, 타인의 권리 또는 법령을 침해하는 내용을 등록해서는 안 됩니다.",
          "워크스페이스 관리자 권한을 가진 이용자는 멤버 관리, 결제 관리, 권한 이전 등 운영상 중요한 기능을 수행할 수 있으므로 관련 조치를 신중하게 해야 합니다.",
        ],
      },
      {
        heading: "5. 금지 행위",
        body: [
          "이용자는 다른 사람의 계정을 도용하거나, 서비스 운영을 방해하거나, 비정상적인 접근을 시도하거나, 관련 법령에 위반되는 방식으로 서비스를 이용해서는 안 됩니다.",
          "자동화된 대량 요청, 보안 취약점 악용, 결제 악용, 반복 환불을 전제로 한 사용, 타인의 기록 열람 또는 변조 시도 역시 금지됩니다.",
        ],
      },
      {
        heading: "6. 서비스 변경 및 중단",
        body: [
          "서비스는 기능 개선, 유지보수, 정책 변경, 장애 대응 등의 사유로 일부 기능을 변경하거나 중단할 수 있습니다.",
          "중요한 변경이 있는 경우 서비스 화면, 공지, 또는 합리적인 방법으로 사전에 안내하는 것을 원칙으로 합니다. 다만 보안 대응, 시스템 장애, 법령상 요구 등 긴급한 사유가 있는 경우에는 변경 또는 중단 후 지체 없이 안내할 수 있습니다.",
        ],
      },
      {
        heading: "7. 계정 탈퇴 및 이용 제한",
        body: [
          "이용자는 서비스가 제공하는 절차에 따라 계정을 탈퇴할 수 있습니다. 다만 워크스페이스의 유일한 관리자인 경우 권한 이전 또는 워크스페이스 정리가 선행될 수 있습니다.",
          "서비스는 약관 위반, 보안 위협, 결제 악용, 타인 피해 발생 등 합리적 사유가 있는 경우 사전 경고 또는 사후 통지를 포함한 합리적인 절차에 따라 이용을 제한할 수 있으며, 긴급한 보안 대응이 필요한 경우에는 즉시 제한 후 가능한 범위에서 사후 안내할 수 있습니다.",
          "이용 제한 조치가 내려진 경우 회사는 확인 가능한 범위에서 제한 사유와 해제 또는 소명 절차를 안내하며, 반복 또는 중대한 위반이 아닌 경우에는 시정 또는 복구 가능성을 함께 검토할 수 있습니다.",
        ],
      },
      {
        heading: "8. 유료 기능, 결제, 환불",
        body: [
          "유료 플랜이 제공되는 경우 요금, 제공 범위, 결제 수단, 결제 주기 등 구체 조건은 결제 화면과 플랜 안내 화면에 고지된 내용을 따릅니다.",
          "정기결제 해지 또는 결제 관리가 필요한 경우 서비스 내 플랜 및 결제 화면 또는 결제 사업자 고객 포털을 통해 진행할 수 있습니다.",
          "환불 또는 취소 요청은 dowin.support@dasoslab.com 또는 서비스 내 '문의하기' 경로로 접수할 수 있으며, 회사는 결제 이력, 사용 상태, 외부 결제 사업자 처리 결과를 확인한 뒤 관련 법령과 '결제 및 환불 정책'에 따라 처리합니다.",
          "결제 완료 직후 실제 플랜 상태 반영에는 외부 결제 사업자의 webhook 처리 시간이 일부 소요될 수 있습니다.",
          "반복 환불 또는 취소 이력이 있는 경우 신규 결제가 제한되거나 수동 검토가 요구될 수 있습니다.",
        ],
      },
      {
        heading: "9. 책임 제한",
        body: [
          "서비스는 안정적인 운영을 위해 노력하지만, 천재지변, 외부 서비스 장애, 이용자 귀책 사유 등 합리적으로 통제하기 어려운 사유로 발생한 손해에 대해서는 관련 법령이 허용하는 범위에서 책임이 제한될 수 있습니다.",
          "다만 회사의 고의 또는 중대한 과실로 인한 손해, 관련 법령상 제한 또는 배제가 허용되지 않는 책임까지 면제되거나 제한되는 것은 아닙니다.",
          "서비스는 이용자가 입력한 목표, 기록, 회고, 메모 내용의 정확성이나 특정 성과 달성을 보장하지 않습니다.",
        ],
      },
      {
        heading: "10. 준거 및 문의",
        body: [
          "본 약관의 해석과 서비스 이용에 관한 분쟁은 대한민국 법령을 기준으로 해석합니다.",
          "서비스 이용 중 문의나 불편 사항은 dowin.support@dasoslab.com 또는 서비스 내 '문의하기' 경로를 통해 접수할 수 있습니다.",
        ],
      },
    ],
  },
  en: {
    title: "Terms of Service",
    subtitle:
      "These Terms of Service set out the conditions for accessing and using the Dowin service.\nThey may be updated when service features, billing flows, or operating policies change.",
    effectiveDateLabel: "Effective date",
    effectiveDate: "2026.04.28",
    footnote:
      "These terms apply to the web service. Additional conditions shown on feature pages, billing screens, or notices may also apply where relevant.",
    sections: [
      {
        heading: "1. Operator and contact",
        body: [
          "Dowin is operated by Dasoslab, whose representative is Hanbee Seo.",
          "The business registration number is 596-12-02628, and the business address is 4F, 8, Dongtanjungsimsangga 2-gil, Hwaseong-si, Gyeonggi-do, Republic of Korea.",
          "Service-related questions may be sent to dowin.support@dasoslab.com.",
        ],
      },
      {
        heading: "2. Purpose and scope",
        body: [
          "These terms govern the user's access to and use of the Dowin web service.",
          "They apply to account features, workspace features, logging features, notifications, and paid-plan features provided by the company through the service.",
        ],
      },
      {
        heading: "3. Sign-up and account management",
        body: [
          "Users must create and use accounts through the procedures required by the service and must provide information that is accurate and up to date.",
          "Each user is responsible for managing passwords, sessions, recovery codes, and other access credentials associated with the account.",
          "If security risks, abnormal activity, or suspected policy violations are detected, the company may require verification, terminate sessions, or restrict account access.",
        ],
      },
      {
        heading: "4. User data and workspace operation",
        body: [
          "Users are responsible for information they enter, upload, or otherwise submit through the service and must not submit content that violates law or infringes the rights of others.",
          "Users with workspace admin permissions are responsible for exercising member-management, billing-management, and admin-transfer functions with due care because those actions may affect other members of the workspace.",
        ],
      },
      {
        heading: "5. Prohibited conduct",
        body: [
          "Users must not impersonate others, interfere with service operations, attempt unauthorized or abnormal access, or use the service in violation of applicable law.",
          "Mass automated requests, exploitation of security weaknesses, billing abuse, repeated refund-oriented misuse, and attempts to access, disclose, or alter another person's records without authorization are prohibited.",
        ],
      },
      {
        heading: "6. Service changes and suspension",
        body: [
          "The company may modify, suspend, or discontinue part of the service where reasonably necessary for feature improvement, maintenance, policy updates, security response, or incident handling.",
          "Where a material change is expected to affect users, the company will generally provide prior notice through the service, a posted announcement, or another reasonable communication method. However, where urgent action is required for security response, system incidents, or legal compliance, the company may give notice promptly after the change or suspension.",
        ],
      },
      {
        heading: "7. Account deletion and service restrictions",
        body: [
          "Users may request account deletion through the service flow. If a user is the sole admin of a workspace, admin transfer or workspace cleanup may be required before deletion is completed.",
          "The company may restrict or suspend use of the service where there is a terms violation, security threat, billing abuse, or a risk of harm to other users or to the service. Where reasonable, the company will use prior warning or later notice as part of the process, and in urgent security situations it may act first and notify later.",
          "Where a restriction is applied, the company will explain the basis for the restriction and any available review or restoration process to the extent it can verify the circumstances, and it may also consider whether correction or restoration is appropriate where the violation is not repeated or severe.",
        ],
      },
      {
        heading: "8. Paid features, billing, and refunds",
        body: [
          "Where paid plans are offered, the applicable pricing, scope, payment methods, and billing cycle are those disclosed in the billing flow and plan screen at the time of purchase.",
          "Users may manage recurring billing, cancellation, or billing settings through the in-product billing screen or the payment provider's customer portal where available.",
          "Refund or cancellation requests may be submitted to dowin.support@dasoslab.com or through the in-product contact path. The company reviews billing history, usage state, and the payment provider's processing result before handling the request under applicable law and the Billing and Refund Policy.",
          "Billing-state updates may not be reflected immediately because they can depend on external webhook processing by the payment provider.",
          "Repeated refund or cancellation history may result in checkout restrictions, temporary holds, or manual review.",
        ],
      },
      {
        heading: "9. Limitation of liability",
        body: [
          "To the extent permitted by applicable law, the company's liability may be limited for losses arising from force majeure, failures of external services, user fault, or circumstances reasonably outside the company's control.",
          "This does not exclude or limit liability for the company's intentional misconduct, gross negligence, or any liability that cannot be excluded or limited under applicable law.",
          "The service does not guarantee the accuracy of user-entered goals, logs, retrospectives, or memos and does not guarantee any particular productivity, business, or performance outcome.",
        ],
      },
      {
        heading: "10. Governing law and contact",
        body: [
          "These terms are governed by and interpreted in accordance with the laws of the Republic of Korea.",
          "Questions, complaints, or billing-related requests about the service may be submitted to dowin.support@dasoslab.com or through the in-product Contact path.",
        ],
      },
    ],
  },
};

const billingPolicyByLocale: Record<Locale, LegalDocumentContent> = {
  ko: {
    title: "결제 및 환불 정책",
    subtitle:
      "본 문서는 Dowin 유료 기능 이용 시 적용되는 결제, 해지, 환불 기준을 설명합니다.\n개별 결제 화면에 별도 조건이 표시되는 경우 그 조건이 함께 적용될 수 있습니다.",
    effectiveDateLabel: "시행일",
    effectiveDate: "2026.04.28",
    footnote:
      "본 정책은 이용약관과 함께 적용됩니다. 법령, 결제 사업자 정책, 실제 운영 방식이 변경되면 본 문서를 함께 갱신합니다.",
    sections: [
      {
        heading: "1. 운영 주체 및 문의처",
        body: [
          "본 유료 기능의 운영 주체는 Dasoslab이며, 대표자는 서한비입니다.",
          "사업자등록번호는 596-12-02628이고, 사업장 주소는 경기 화성시 동탄중심상가2길 8 4층입니다.",
          "결제, 해지, 환불 관련 문의는 dowin.support@dasoslab.com으로 접수할 수 있습니다.",
        ],
      },
      {
        heading: "2. 적용 범위",
        body: [
          "본 정책은 서비스에서 제공하는 유료 플랜, 정기결제, 결제 상태 변경, 환불 또는 취소 요청 처리에 적용됩니다.",
          "구체적인 요금, 결제 수단, 결제 주기, 제공 기능 범위는 결제 화면과 플랜 안내 화면에 표시된 내용을 따릅니다.",
        ],
      },
      {
        heading: "3. 결제 및 플랜 반영",
        body: [
          "결제는 외부 결제 사업자를 통해 처리될 수 있으며, 결제 완료 후 실제 플랜 상태 반영에는 webhook 처리 시간이 일부 소요될 수 있습니다.",
          "결제 완료 직후 서비스 화면에 즉시 상태가 바뀌지 않더라도, 잠시 후 새로고침하거나 다시 접속하면 최신 상태가 반영될 수 있습니다.",
        ],
      },
      {
        heading: "4. 정기결제 해지",
        body: [
          "정기결제 해지 또는 결제수단 변경은 서비스 내 플랜 및 결제 화면 또는 결제 사업자 고객 포털에서 진행할 수 있습니다.",
          "일반적인 해지는 즉시 환불이 아니라 다음 결제일부터 과금이 중단되는 방식으로 처리되며, 이미 결제된 현재 이용 기간 동안은 플랜 권한이 유지될 수 있습니다.",
        ],
      },
      {
        heading: "5. 환불 원칙",
        body: [
          "회사는 관련 법령상 이용자에게 인정되는 청약철회, 취소, 환불 권리를 우선 적용합니다.",
          "정기결제 해지는 원칙적으로 다음 결제일부터 과금이 중단되는 절차이며, 일반적인 해지 자체가 이미 결제된 기간에 대한 환불을 의미하지는 않습니다.",
          "유료 기능이 결제 직후 즉시 제공되는 구조, 이미 상당 부분 사용이 개시된 상태, 또는 관련 법령상 청약철회 제한 사유가 인정되는 경우에는 법령이 허용하는 범위에서 환불 가능 범위가 달라질 수 있습니다.",
          "회사는 원칙적으로 단순 변심, 사용 도중의 중도 해지, 기대와의 주관적 차이만을 이유로 이미 결제된 이용 기간 전체에 대한 환불을 보장하지 않습니다. 다만 이는 법령상 보장되는 권리를 제한하기 위한 것이 아닙니다.",
          "다만 중복 결제, 명백한 오결제, 결제 직후 기술적 오류로 유료 권한이 정상 제공되지 않은 경우, 법령상 환불이 필요한 경우 등 객관적으로 확인 가능한 예외 사유가 있는 때에는 환불 또는 취소를 검토할 수 있습니다.",
          "환불 또는 취소 검토 시 회사는 결제 시점, 실제 권한 제공 여부, 사용 개시 여부, 결제 사업자 처리 결과, 관련 법령상 권리 발생 여부 등을 함께 확인할 수 있습니다.",
        ],
      },
      {
        heading: "6. 환불 및 취소 요청 방법",
        body: [
          "환불 또는 취소 요청은 dowin.support@dasoslab.com 또는 서비스 내 '문의하기' 경로로 접수할 수 있습니다.",
          "회사는 결제 이력, 사용 상태, 외부 결제 사업자 처리 결과를 확인한 뒤 관련 법령, 결제 사업자 정책, 본 정책에 따라 처리 여부와 처리 방식을 검토합니다.",
          "환불 요청 시 결제 일시, 결제 수단, 문제가 된 주문 또는 워크스페이스, 요청 사유 등 확인에 필요한 정보를 요청할 수 있습니다.",
          "이용자가 관련 자료 제출 또는 사실 확인에 협조하지 않는 경우, 회사는 확인 가능한 범위 내에서만 요청을 검토할 수 있습니다.",
        ],
      },
      {
        heading: "7. 결제 제한 및 수동 검토",
        body: [
          "도용이 의심되는 결제, 중복 결제 악용, 비정상적인 결제 시도, 객관적으로 확인 가능한 반복 악용 패턴이 있는 경우 신규 결제가 제한되거나 수동 검토가 요구될 수 있습니다.",
          "정상적인 법정 환불권 행사 자체만을 이유로 신규 결제를 제한하지는 않으며, 제한 또는 수동 검토는 결제 안전성과 악용 방지 관점에서 필요한 범위에서만 적용합니다.",
          "이 경우 회사는 필요 시 추가 확인, 고객지원 안내, 또는 해제 가능 여부에 관한 절차를 안내할 수 있습니다.",
        ],
      },
    ],
  },
  en: {
    title: "Billing and Refund Policy",
    subtitle:
      "This document describes the billing, cancellation, and refund rules that apply when users purchase paid features in Dowin.\nWhere separate conditions are shown in the billing flow, those conditions may also apply.",
    effectiveDateLabel: "Effective date",
    effectiveDate: "2026.04.28",
    footnote:
      "This policy applies together with the Terms of Service. We may update it when legal requirements, payment-provider rules, or operating practices change.",
    sections: [
      {
        heading: "1. Operator and contact",
        body: [
          "The paid features described in this policy are operated by Dasoslab, whose representative is Hanbee Seo.",
          "The business registration number is 596-12-02628, and the business address is 4F, 8, Dongtanjungsimsangga 2-gil, Hwaseong-si, Gyeonggi-do, Republic of Korea.",
          "Questions about billing, cancellation, or refunds may be sent to dowin.support@dasoslab.com.",
        ],
      },
      {
        heading: "2. Scope",
        body: [
          "This policy applies to paid plans, recurring billing, billing-state changes, and the handling of refund or cancellation requests within the service.",
          "Specific pricing, payment methods, billing cycles, and feature scope are those disclosed in the billing flow and plan screen at the time of purchase.",
        ],
      },
      {
        heading: "3. Billing and plan activation",
        body: [
          "Payments may be processed through an external payment provider, and plan activation in the service may take additional time to reflect because it can depend on webhook processing.",
          "If the billing state does not change immediately after payment, the latest status may appear after a short delay, refresh, or re-entry into the service.",
        ],
      },
      {
        heading: "4. Recurring billing cancellation",
        body: [
          "Users may cancel recurring billing or change billing methods through the in-product billing screen or the payment provider's customer portal where available.",
          "As a general rule, cancellation stops future billing from the next billing date rather than creating an immediate refund, and access to the paid plan may remain available during the already-paid period.",
        ],
      },
      {
        heading: "5. Refund principles",
        body: [
          "Any cancellation, withdrawal, or refund rights granted to the user under applicable law take priority.",
          "Cancellation of recurring billing generally means future billing stops from the next billing date and does not, by itself, create a refund for an already-paid period.",
          "If the paid feature is made available immediately after payment, has already been substantially used, or falls under a lawful limitation on withdrawal or refund rights, the actual refund scope may differ to the extent permitted by law.",
          "As a general rule, the company does not guarantee a refund of the full already-paid period solely because of a change of mind, mid-period cancellation, or subjective dissatisfaction with the service. This sentence does not limit refund rights that are granted by law.",
          "However, the company may review a refund or cancellation request where there has been duplicate payment, an obvious mistaken charge, a technical failure that prevented paid access from being properly provided right after payment, a refund right required by applicable law, or another objectively verifiable exceptional circumstance.",
          "When reviewing a refund or cancellation request, the company may consider the timing of the payment, whether paid access was actually provided, whether use had already started, the payment provider's processing result, and whether a refund right arises under applicable law.",
        ],
      },
      {
        heading: "6. How to request a refund or cancellation",
        body: [
          "Refund or cancellation requests may be submitted to dowin.support@dasoslab.com or through the in-product contact path.",
          "The company reviews billing history, usage state, the payment provider's processing result, applicable law, and this policy before determining how the request should be handled.",
          "When needed, the company may ask for information such as the payment date, payment method, affected order or workspace, and the reason for the request.",
          "If the user does not cooperate with reasonable information requests or fact verification, the company may review the request only within the scope it can verify.",
        ],
      },
      {
        heading: "7. Billing restrictions and manual review",
        body: [
          "Checkout may be restricted or subject to manual review where there is suspected stolen-payment use, duplicate-payment abuse, abnormal payment attempts, or another objectively verifiable pattern of repeated abuse.",
          "The company does not restrict new checkout solely because a user exercised a lawful refund right, and any restriction or manual review is applied only to the extent reasonably necessary for payment safety and abuse prevention.",
          "In such cases, the company may request additional verification, provide further support guidance, or explain whether the restriction can be lifted.",
        ],
      },
    ],
  },
};

export function getPrivacyPolicy(locale: Locale): LegalDocumentContent {
  return privacyByLocale[locale];
}

export function getTermsOfService(locale: Locale): LegalDocumentContent {
  return termsByLocale[locale];
}

export function getBillingPolicy(locale: Locale): LegalDocumentContent {
  return billingPolicyByLocale[locale];
}
