import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "kg" | "ru";

type Dict = Record<string, { kg: string; ru: string }>;

const dict: Dict = {
  // Brand & nav
  app_name: { kg: "Долбоор CRM", ru: "Долбоор CRM" },
  nav_dashboard: { kg: "Башкы бет", ru: "Главная" },
  nav_clients: { kg: "Кардарлар", ru: "Клиенты" },
  nav_leads: { kg: "Лиддер", ru: "Лиды" },
  nav_tasks: { kg: "Тапшырмалар", ru: "Задачи" },
  nav_calendar: { kg: "Календарь", ru: "Календарь" },
  nav_reports: { kg: "Отчеттор", ru: "Отчёты" },
  nav_users: { kg: "Колдонуучулар", ru: "Пользователи" },
  sign_out: { kg: "Чыгуу", ru: "Выйти" },

  // Auth
  auth_title: { kg: "CRM системага кириңиз", ru: "Войти в CRM" },
  auth_subtitle: { kg: "Сатууну, кардарларды жана тапшырмаларды башкарыңыз", ru: "Управляйте продажами, клиентами и задачами" },
  sign_in: { kg: "Кирүү", ru: "Войти" },
  sign_up: { kg: "Катталуу", ru: "Регистрация" },
  email: { kg: "Электрондук почта", ru: "Email" },
  password: { kg: "Сырсөз", ru: "Пароль" },
  full_name: { kg: "Толук атыңыз", ru: "Полное имя" },
  have_account: { kg: "Аккаунтуңуз барбы? Кирүү", ru: "Уже есть аккаунт? Войти" },
  no_account: { kg: "Аккаунт жокпу? Катталуу", ru: "Нет аккаунта? Регистрация" },
  first_user_admin: { kg: "Биринчи катталган колдонуучу автоматтык түрдө Администратор болот.", ru: "Первый зарегистрированный пользователь автоматически становится Администратором." },

  // Common
  create: { kg: "Кошуу", ru: "Создать" },
  save: { kg: "Сактоо", ru: "Сохранить" },
  cancel: { kg: "Жокко чыгаруу", ru: "Отмена" },
  delete: { kg: "Өчүрүү", ru: "Удалить" },
  edit: { kg: "Түзөтүү", ru: "Редактировать" },
  search: { kg: "Издөө...", ru: "Поиск..." },
  loading: { kg: "Жүктөлүүдө...", ru: "Загрузка..." },
  empty: { kg: "Маалымат жок", ru: "Нет данных" },
  confirm_delete: { kg: "Чын эле өчүрөсүзбү?", ru: "Точно удалить?" },
  optional: { kg: "милдеттүү эмес", ru: "необязательно" },

  // Dashboard
  total_clients: { kg: "Жалпы кардарлар", ru: "Всего клиентов" },
  active_leads: { kg: "Активдүү лиддер", ru: "Активные лиды" },
  open_tasks: { kg: "Ачык тапшырмалар", ru: "Открытые задачи" },
  won_amount: { kg: "Жабылган сатуулар", ru: "Закрытые сделки" },
  recent_activity: { kg: "Акыркы аракеттер", ru: "Последняя активность" },
  welcome: { kg: "Кош келиңиз", ru: "Добро пожаловать" },

  // Clients
  clients_title: { kg: "Кардарлар", ru: "Клиенты" },
  new_client: { kg: "Жаңы кардар", ru: "Новый клиент" },
  client_name: { kg: "Аты", ru: "Имя" },
  company: { kg: "Компания", ru: "Компания" },
  phone: { kg: "Телефон", ru: "Телефон" },
  address: { kg: "Дарек", ru: "Адрес" },
  notes: { kg: "Эскертүүлөр", ru: "Заметки" },
  assigned_to: { kg: "Жооптуу", ru: "Ответственный" },

  // Leads / pipeline
  leads_title: { kg: "Сатуу воронкасы", ru: "Воронка продаж" },
  new_lead: { kg: "Жаңы лид", ru: "Новый лид" },
  lead_title: { kg: "Лиддин аталышы", ru: "Название лида" },
  amount: { kg: "Сумма", ru: "Сумма" },
  source: { kg: "Булагы", ru: "Источник" },
  client: { kg: "Кардар", ru: "Клиент" },
  status_new: { kg: "Жаңы", ru: "Новый" },
  status_contacted: { kg: "Байланышты", ru: "Связались" },
  status_negotiation: { kg: "Сүйлөшүүдө", ru: "Переговоры" },
  status_won: { kg: "Жабылды (+)", ru: "Выиграно" },
  status_lost: { kg: "Жабылды (−)", ru: "Проиграно" },

  // Tasks
  tasks_title: { kg: "Тапшырмалар", ru: "Задачи" },
  new_task: { kg: "Жаңы тапшырма", ru: "Новая задача" },
  task_title: { kg: "Тапшырманын аталышы", ru: "Название задачи" },
  description: { kg: "Сүрөттөмө", ru: "Описание" },
  due_date: { kg: "Аткаруу мөөнөтү", ru: "Срок" },
  priority: { kg: "Маанилүүлүк", ru: "Приоритет" },
  priority_low: { kg: "Төмөн", ru: "Низкий" },
  priority_medium: { kg: "Орточо", ru: "Средний" },
  priority_high: { kg: "Жогорку", ru: "Высокий" },
  status: { kg: "Статус", ru: "Статус" },
  task_todo: { kg: "Аткарыла элек", ru: "К выполнению" },
  task_in_progress: { kg: "Процессте", ru: "В работе" },
  task_done: { kg: "Аткарылды", ru: "Выполнено" },
  task_cancelled: { kg: "Жокко чыгарылды", ru: "Отменено" },

  // Calendar / events
  calendar_title: { kg: "Календарь", ru: "Календарь" },
  new_event: { kg: "Жаңы окуя", ru: "Новое событие" },
  event_title: { kg: "Окуянын аталышы", ru: "Название события" },
  event_type: { kg: "Түрү", ru: "Тип" },
  type_meeting: { kg: "Жолугушуу", ru: "Встреча" },
  type_call: { kg: "Чалуу", ru: "Звонок" },
  type_reminder: { kg: "Эскертме", ru: "Напоминание" },
  starts_at: { kg: "Башталат", ru: "Начало" },
  ends_at: { kg: "Аяктайт", ru: "Конец" },
  today: { kg: "Бүгүн", ru: "Сегодня" },
  upcoming: { kg: "Жакынкы окуялар", ru: "Предстоящие события" },

  // Reports
  reports_title: { kg: "Отчеттор", ru: "Отчёты" },
  conversion_rate: { kg: "Конверсия", ru: "Конверсия" },
  by_status: { kg: "Статус боюнча", ru: "По статусам" },
  by_manager: { kg: "Менеджер боюнча", ru: "По менеджерам" },
  new_clients_month: { kg: "Айдын ичинде жаңы кардарлар", ru: "Новых клиентов за месяц" },

  // Users / admin
  users_title: { kg: "Колдонуучуларды башкаруу", ru: "Управление пользователями" },
  role: { kg: "Роль", ru: "Роль" },
  role_admin: { kg: "Администратор", ru: "Администратор" },
  role_manager: { kg: "Менеджер", ru: "Менеджер" },
  role_employee: { kg: "Кызматкер", ru: "Сотрудник" },
  change_role: { kg: "Ролду өзгөртүү", ru: "Изменить роль" },
  admin_only: { kg: "Бул бөлүм администратор үчүн гана.", ru: "Этот раздел доступен только администратору." },
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof dict) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("kg");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("crm_lang") as Lang | null;
    if (saved === "kg" || saved === "ru") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("crm_lang", l);
  };

  const t = (key: keyof typeof dict) => dict[key]?.[lang] ?? String(key);

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n outside provider");
  return c;
}
