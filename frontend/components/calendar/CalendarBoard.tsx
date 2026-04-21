"use client";

import { Calendar, dateFnsLocalizer, type Event as RbcEvent, type View } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { addDays, format, getDay, parse, startOfWeek } from "date-fns";
import type { StartOfWeekOptions } from "date-fns";
import { tr, enUS } from "date-fns/locale";
import { useState } from "react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

type CalendarEvent = RbcEvent & {
  resource: {
    id: string;
    status: string;
  };
};

type Props = {
  locale: "tr" | "en";
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onMoveEvent: (event: CalendarEvent, start: Date, end: Date) => void;
};

type ToolbarProps = {
  label: string;
  onNavigate: (action: "PREV" | "NEXT" | "TODAY") => void;
  onView: (view: View) => void;
  view: View;
  locale: "tr" | "en";
};

const locales = {
  tr,
  en: enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date, options?: StartOfWeekOptions<Date>) => startOfWeek(date, { ...options, weekStartsOn: 1 }),
  getDay,
  locales,
});
const DnDCalendar = withDragAndDrop<CalendarEvent, object>(Calendar as never);

function CalendarToolbar({ label, onNavigate, onView, view, locale }: ToolbarProps) {
  const views: Array<{ id: View; label: string }> =
    locale === "tr"
      ? [
          { id: "month", label: "Ay" },
          { id: "week", label: "Hafta" },
          { id: "day", label: "Gun" },
          { id: "agenda", label: "Ajanda" },
        ]
      : [
          { id: "month", label: "Month" },
          { id: "week", label: "Week" },
          { id: "day", label: "Day" },
          { id: "agenda", label: "Agenda" },
        ];

  return (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onNavigate("PREV")} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800">
          {locale === "tr" ? "Geri" : "Back"}
        </button>
        <button type="button" onClick={() => onNavigate("TODAY")} className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
          {locale === "tr" ? "Bugun" : "Today"}
        </button>
        <button type="button" onClick={() => onNavigate("NEXT")} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800">
          {locale === "tr" ? "Ileri" : "Next"}
        </button>
      </div>
      <h3 className="text-center text-lg font-semibold text-slate-800 dark:text-slate-100">{label}</h3>
      <div className="flex flex-wrap items-center gap-2">
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onView(v.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
              view === v.id
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const messages = {
  tr: {
    next: "Ileri",
    previous: "Geri",
    today: "Bugun",
    month: "Ay",
    week: "Hafta",
    day: "Gun",
    agenda: "Ajanda",
    date: "Tarih",
    time: "Saat",
    event: "Gonderi",
    noEventsInRange: "Bu aralikta gonderi yok.",
    showMore: (total: number) => `+${total} daha`,
  },
  en: {
    next: "Next",
    previous: "Back",
    today: "Today",
    month: "Month",
    week: "Week",
    day: "Day",
    agenda: "Agenda",
    date: "Date",
    time: "Time",
    event: "Post",
    noEventsInRange: "No posts in this range.",
    showMore: (total: number) => `+${total} more`,
  },
};

export function CalendarBoard({ locale, events, onSelectEvent, onMoveEvent }: Props) {
  const [activeDate, setActiveDate] = useState<Date>(new Date());
  const [activeView, setActiveView] = useState<View>("month");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <DnDCalendar
          localizer={localizer}
          culture={locale}
          style={{ height: 680 }}
          events={events}
          date={activeDate}
          view={activeView}
          views={["month", "week", "day", "agenda"]}
          startAccessor={(event) => event.start as Date}
          endAccessor={(event) => event.end as Date}
          messages={messages[locale]}
          popup
          selectable
          onNavigate={(date) => setActiveDate(date)}
          onView={(view) => setActiveView(view)}
          components={{
            toolbar: (props) => (
              <CalendarToolbar
                label={props.label}
                onNavigate={(action) => props.onNavigate(action)}
                onView={(view) => props.onView(view)}
                view={props.view}
                locale={locale}
              />
            ),
            event: ({ event }) => <span className="block truncate text-xs font-semibold">{(event as CalendarEvent).title}</span>,
          }}
          onSelectEvent={(event) => onSelectEvent(event as CalendarEvent)}
          onEventDrop={({ event, start, end }) =>
            onMoveEvent(event as CalendarEvent, start as Date, (end as Date) || addDays(start as Date, 1))
          }
          onEventResize={({ event, start, end }) =>
            onMoveEvent(event as CalendarEvent, start as Date, (end as Date) || addDays(start as Date, 1))
          }
          resizable
          eventPropGetter={(event) => {
            const status = (event as CalendarEvent).resource.status;
            if (status === "SUCCESS") {
              return { className: "bg-emerald-600 text-white rounded-md border-none px-1" };
            }
            if (status === "FAILED") {
              return { className: "bg-rose-600 text-white rounded-md border-none px-1" };
            }
            return { className: "bg-blue-600 text-white rounded-md border-none px-1" };
          }}
        />
    </div>
  );
}

export type { CalendarEvent };
