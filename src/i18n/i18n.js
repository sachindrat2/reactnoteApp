import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  en: {
    translation: {
              rememberMe: "Remember Me",
              rememberMe: "ログイン状態を保持する",
            Verification: "Verification",
            verifyCode: {
              instructions: "Enter the 6-digit code sent to your email to verify your account.",
              success: "Your account has been verified! Redirecting...",
              error: "Verification failed. Please check your code and try again.",
              redirect: "You will be redirected shortly..."
            },
            verifying: "Verifying...",
            verify: "Verify",
            Verification: "認証",
            verifyCode: {
              instructions: "メールに送信された6桁のコードを入力してアカウントを認証してください。",
              success: "アカウントが認証されました！リダイレクト中...",
              error: "認証に失敗しました。コードを確認して再度お試しください。",
              redirect: "まもなくリダイレクトされます..."
            },
            verifying: "認証中...",
            verify: "認証する",
      switchToRegisterNew: "New? Create Account",
      switchToLoginNew: "Already have an account? Sign In",
      registrationSuccessCheckEmail: "Registration successful! Please check your email to verify your account before logging in.",
      // App Title
      appTitle: "NotesApp",
      appSubtitle: "Personal Note Taking",
      
      // Authentication
      signIn: "Sign in to continue to your notes",
      joinApp: "Join NotesApp and start organizing your thoughts",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      "username.label": "Username",
      "username.placeholder": "Enter your username",
      loginButton: "Sign In",
      registerButton: "Create Account",
      switchToRegister: "Don't have an account? Sign up",
      switchToLogin: "Already have an account? Sign in",
      demoLogin: "🚀 Try Demo Login",
      loggingIn: "Logging in...",
      creatingAccount: "Creating account...",
      orContinueWith: "Or continue with email",
      
      // Error Messages
      passwordsNoMatch: "Passwords do not match",
      loginFailed: "Login failed. Please check your credentials and try again.",
      userNotFound: "User not found or not registered. Please register first.",
      registrationFailed: "Registration failed. Please try again.",
      
      // Navigation
      backToNotes: "Back to Notes",
      back: "Back",
      
      // Notes List
      welcomeBack: "Welcome back",
      welcome: "Welcome",
      notesCount_one: "{{count}} note",
      notesCount_other: "{{count}} notes",
      searchPlaceholder: "Search notes...",
      addNote: "Add Note",
      noNotes: "No notes yet",
      noNotesDesc: "Create your first note to get started",
      createFirstNote: "Create your first note",
      
      // Note Card
      open: "Open",
      openArrow: "Open →",
      createdDate: "Created {{date}}",
      updatedDate: "Updated {{date}}",
      justNow: "Just now",
      minutesAgo: "{{count}}m ago",
      hoursAgo: "{{count}}h ago",
      yesterday: "Yesterday",
      daysAgo: "{{count}} days ago",
      noDate: "No date",
      
      // Note Editor
      untitledNote: "Untitled Note",
      titlePlaceholder: "Note title...",
      contentPlaceholder: "Start writing your note...",
      tagsPlaceholder: "Tags (comma separated)",
      save: "Save",
      saving: "Saving...",
      saveChanges: "Save Changes",
      saved: "Saved",
      deleteNote: "Delete Note",
      deleteConfirm: "Are you sure you want to delete this note? This action cannot be undone.",
      backToNotes: "Back to Notes",
      tagsLabel: "Tags (separate with commas)",
      charactersAndWords: "{{characters}} characters, {{words}} words",
      keyboardShortcuts: "Press Ctrl+S to save, Escape to close",
      
      // Add Note Modal
      addNewNote: "Add New Note",
      createNewNote: "Create New Note",
      addNewNoteDesc: "Add a new note to your collection",
      createNote: "Create Note",
      cancel: "Cancel",
      title: "Title",
      content: "Content",
      tags: "Tags (optional)",
      tagsDescription: "Separate tags with commas",
      quickTips: "Quick Tips",
      tipEscape: "• Press Escape to cancel",
      tipTags: "• Use tags to organize your notes",
      tipEdit: "• You can edit the note after creating it",
      charactersCount: "{{count}} characters, {{words}} words",
      
      // Date/Time
      created: "Created",
      updated: "Updated",
      
      // General
      loading: "Loading...",
      error: "Error",
      success: "Success",
      close: "Close",

      // Logout Modal
      logout: "Logout",
      logoutConfirmTitle: "Are you sure you want to logout?",
      logoutConfirmDesc: "You will be signed out of your account.",
      yes: "Yes",
      no: "No",
      
      // Reset Password Screen
      resetPassword: {
        title: "Reset Password",
        nameLabel: "Name",
        namePlaceholder: "Enter your name",
        nameRequired: "Name is required.",
        newPasswordLabel: "New Password",
        newPasswordPlaceholder: "Enter your new password",
        show: "Show",
        hide: "Hide",
        confirmPasswordLabel: "Confirm Password",
        confirmPasswordPlaceholder: "Re-enter your new password",
        resetButton: "Reset Password",
        saving: "Resetting...",
        success: "Password reset successful! Redirecting...",
        error: "Failed to reset password. Please try again.",
        noMatch: "Passwords do not match.",
        invalidLink: "Invalid or expired reset link.",
        redirect: "You will be redirected shortly..."
      },
      // Forgot Password Screen
      "forgotPassword.title": "Forgot Password",
      "forgotPassword.emailPlaceholder": "Enter your email",
      "forgotPassword.sending": "Sending...",
      "forgotPassword.sendButton": "Send",
      "forgotPassword.link": "Forgot password?",
      "sent": "Password reset email sent! Please check your inbox.",
      "error": "Error sending email. Please try again.",
      // Language Switcher
      language: "Language",
      english: "English",
      japanese: "日本語",
      
      // Profile Modal
      profile: "Profile",
      username: "Username", 
      saveProfile: "Save Profile",
      saving: "Saving...",
      addAvatar: "Add",
      changeAvatar: "Change",
      removeAvatar: "Remove",
      usernameReadonly: "Username cannot be changed",
      emailReadonly: "Email cannot be changed"
    }
  },
  ja: {
    translation: {
      switchToRegisterNew: "新規ですか？アカウント作成",
      switchToLoginNew: "すでにアカウントをお持ちですか？サインイン",
      registrationSuccessCheckEmail: "登録が完了しました。ログインする前に、メールの認証リンクをクリックしてください。",
      // App Title
      appTitle: "ノートアプリ",
      appSubtitle: "個人ノートアプリ",
      
      // Authentication
      signIn: "ノートにアクセスするためにサインインしてください",
      joinApp: "ノートアプリに参加して、思考を整理しましょう",
      email: "メールアドレス",
      password: "パスワード",
      confirmPassword: "パスワード確認",
      loginButton: "サインイン",
      registerButton: "アカウント作成",
      switchToRegister: "アカウントをお持ちでない方はこちら",
      switchToLogin: "既にアカウントをお持ちの方はこちら",
      demoLogin: "🚀 デモログインを試す",
      loggingIn: "ログイン中...",
      creatingAccount: "アカウント作成中...",
      orContinueWith: "またはメールアドレスで続行",
      
      // Error Messages
      passwordsNoMatch: "パスワードが一致しません",
      loginFailed: "ログインに失敗しました。認証情報を確認してもう一度お試しください。",
      userNotFound: "ユーザーが見つかりません。まだ登録されていません。まずはアカウントを作成してください。",
      registrationFailed: "アカウント作成に失敗しました。もう一度お試しください。",
      
      // Navigation
      backToNotes: "ノート一覧に戻る",
      back: "戻る",
      
      // Notes List
      welcomeBack: "ようこそ",
      welcome: "ようこそ",
      notesCount_one: "{{count}}件のノート",
      notesCount_other: "{{count}}件のノート",
      searchPlaceholder: "ノートを検索...",
      addNote: "ノート追加",
      noNotes: "まだノートがありません",
      noNotesDesc: "最初のノートを作成して始めましょう",
      createFirstNote: "最初のノートを作成",
      
      // Note Card
      open: "開く",
      openArrow: "開く →",
      createdDate: "作成日: {{date}}",
      updatedDate: "更新日: {{date}}",
      justNow: "たった今",
      minutesAgo: "{{count}}分前",
      hoursAgo: "{{count}}時間前",
      yesterday: "昨日",
      daysAgo: "{{count}}日前",
      noDate: "日付なし",
      
      // Note Editor
      untitledNote: "無題のノート",
      titlePlaceholder: "ノートのタイトル...",
      contentPlaceholder: "ノートを書き始めてください...",
      tagsPlaceholder: "タグ（カンマ区切り）",
      save: "保存",
      saving: "保存中...",
      saveChanges: "変更を保存",
      saved: "保存済み",
      deleteNote: "ノート削除",
      deleteConfirm: "このノートを削除しますか？この操作は元に戻せません。",
      backToNotes: "ノートに戻る",
      tagsLabel: "タグ（カンマで区切ってください）",
      charactersAndWords: "{{characters}}文字、{{words}}語",
      keyboardShortcuts: "Ctrl+Sで保存、Escapeで閉じる",
      
      // Add Note Modal
      addNewNote: "新しいノート追加",
      createNewNote: "新しいノートを作成",
      addNewNoteDesc: "コレクションに新しいノートを追加",
      createNote: "ノート作成",
      cancel: "キャンセル",
      title: "タイトル",
      content: "内容",
      tags: "タグ（オプション）",
      tagsDescription: "タグはカンマで区切ってください",
      quickTips: "クイックヒント",
      tipEscape: "• Escapeキーでキャンセル",
      tipTags: "• タグでノートを整理できます",
      tipEdit: "• 作成後にノートを編集できます",
      charactersCount: "{{count}}文字、{{words}}語",
      
      // Date/Time
      created: "作成日",
      updated: "更新日",
      
      // General
      loading: "読み込み中...",
      error: "エラー",
      success: "成功",
      close: "閉じる",

      // Logout Modal
      logout: "ログアウト",
      logoutConfirmTitle: "ログアウトしますか？",
      logoutConfirmDesc: "アカウントからサインアウトします。",
      yes: "はい",
      no: "いいえ",
      
      // Reset Password Screen
      resetPassword: {
        title: "パスワードリセット",
        nameLabel: "名前",
        namePlaceholder: "名前を入力してください",
        nameRequired: "名前は必須です。",
        newPasswordLabel: "新しいパスワード",
        newPasswordPlaceholder: "新しいパスワードを入力してください",
        show: "表示",
        hide: "非表示",
        confirmPasswordLabel: "パスワード確認",
        confirmPasswordPlaceholder: "新しいパスワードを再入力してください",
        resetButton: "パスワードをリセット",
        saving: "リセット中...",
        success: "パスワードがリセットされました！リダイレクト中...",
        error: "パスワードのリセットに失敗しました。もう一度お試しください。",
        noMatch: "パスワードが一致しません。",
        invalidLink: "無効または期限切れのリセットリンクです。",
        redirect: "まもなくリダイレクトされます..."
      },
      // Forgot Password Screen
      "forgotPassword.title": "パスワードをお忘れですか",
      "forgotPassword.emailPlaceholder": "メールアドレスを入力してください",
      "forgotPassword.sending": "送信中...",
      "forgotPassword.sendButton": "送信",
      "forgotPassword.link": "パスワードをお忘れですか？",
      "sent": "パスワードリセット用のメールを送信しました。受信箱をご確認ください。",
      "error": "メール送信中にエラーが発生しました。もう一度お試しください。",
      // Language Switcher
      language: "言語",
      english: "English",
      japanese: "日本語",
      "username.label": "ユーザー名",
      "username.placeholder": "ユーザー名を入力してください",
      
      // Profile Modal
      profile: "プロフィール",
      username: "ユーザー名",
      saveProfile: "プロフィールを保存",
      saving: "保存中...",
      addAvatar: "追加",
      changeAvatar: "変更",
      removeAvatar: "削除",
      usernameReadonly: "ユーザー名は変更できません",
      emailReadonly: "メールアドレスは変更できません"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'notesapp_language',
      caches: ['localStorage'],
    }
  });

export default i18n;