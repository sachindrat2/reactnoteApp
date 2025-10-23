import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  en: {
    translation: {
      // App Title
      appTitle: "NotesApp",
      appSubtitle: "Personal Note Taking",
      
      // Authentication
      signIn: "Sign in to continue to your notes",
      joinApp: "Join NotesApp and start organizing your thoughts",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
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
      registrationFailed: "Registration failed. Please try again.",
      
      // Navigation
      backToNotes: "Back to Notes",
      
      // Notes List
      welcomeBack: "Welcome back",
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
      deleteNote: "Delete Note",
      deleteConfirm: "Are you sure you want to delete this note? This action cannot be undone.",
      
      // Add Note Modal
      addNewNote: "Add New Note",
      createNote: "Create Note",
      cancel: "Cancel",
      
      // Date/Time
      created: "Created",
      updated: "Updated",
      
      // General
      loading: "Loading...",
      error: "Error",
      success: "Success",
      close: "Close",
      
      // Language Switcher
      language: "Language",
      english: "English",
      japanese: "日本語"
    }
  },
  ja: {
    translation: {
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
      registrationFailed: "アカウント作成に失敗しました。もう一度お試しください。",
      
      // Navigation
      backToNotes: "ノート一覧に戻る",
      
      // Notes List
      welcomeBack: "おかえりなさい",
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
      deleteNote: "ノート削除",
      deleteConfirm: "このノートを削除しますか？この操作は元に戻せません。",
      
      // Add Note Modal
      addNewNote: "新しいノート追加",
      createNote: "ノート作成",
      cancel: "キャンセル",
      
      // Date/Time
      created: "作成日",
      updated: "更新日",
      
      // General
      loading: "読み込み中...",
      error: "エラー",
      success: "成功",
      close: "閉じる",
      
      // Language Switcher
      language: "言語",
      english: "English",
      japanese: "日本語"
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