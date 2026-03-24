"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, PlaneLanding, PlaneTakeoff, RefreshCw } from "lucide-react";
import { AirportOption, TripType } from "@/lib/types";
import clsx from "clsx";

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);
  return debounced;
}

function AirportField({
  label,
  value,
  onChange,
  onSelect,
  icon: Icon,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (option: AirportOption) => void;
  icon: typeof PlaneTakeoff;
  placeholder: string;
}) {
  const [options, setOptions] = useState<AirportOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [hasTyped, setHasTyped] = useState(false);
  const debounced = useDebouncedValue(value, 300);

  useEffect(() => {
    if (debounced.trim().length < 2) {
      setOptions([]);
      setOpen(false);
      return;
    }

    let active = true;
    setLoading(true);
    fetch(`/api/airports?keyword=${encodeURIComponent(debounced)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setOptions(data.options ?? []);
        setOpen(true);
      })
      .catch(() => {
        if (!active) return;
        setOptions([]);
        setOpen(true);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debounced]);

  const showPanel = open && (loading || options.length > 0 || hasTyped);

  return (
    <div className="lg:col-span-1">
      <label className="mb-2.5 block px-1 text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-500/80">
        {label}
      </label>
      <div className="relative">
        <div className="flex items-center gap-3 rounded-lg border border-slate-200/80 bg-white p-3.5 transition-colors hover:border-slate-300">
          <Icon className="h-5 w-5 text-slate-500" strokeWidth={1.9} />
          <input
            value={value}
            onChange={(event) => {
              setHasTyped(true);
              onChange(event.target.value);
            }}
            placeholder={placeholder}
            className="w-full border-none bg-transparent p-0 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
            onFocus={() => value.trim().length > 1 && setOpen(true)}
          />
        </div>
        {loading && value.length > 1 && (
          <span className="absolute right-4 top-4 text-[11px] text-slate-400">Searching...</span>
        )}
        {showPanel && (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
            {options.length === 0 && !loading && (
              <div className="px-4 py-3 text-xs text-slate-500">No matches found.</div>
            )}
            {options.map((option) => (
              <button
                key={`${option.iataCode}-${option.name}`}
                type="button"
                onClick={() => {
                  onSelect(option);
                  setOptions([]);
                  setOpen(false);
                  setHasTyped(false);
                }}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-slate-50"
              >
                <span>
                  <span className="font-semibold text-slate-900">{option.city || option.name}</span>
                  <span className="text-slate-500"> · {option.name}</span>
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {option.iataCode}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FlightSearchForm() {
  const router = useRouter();
  const [tripType, setTripType] = useState<TripType>("RETURN");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromCode, setFromCode] = useState("");
  const [toCode, setToCode] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const isReturn = tripType === "RETURN";
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!isReturn) {
      setReturnDate("");
      return;
    }

    if (departureDate && !returnDate) {
      const base = new Date(departureDate);
      const next = new Date(base.getTime() + 24 * 60 * 60 * 1000);
      setReturnDate(next.toISOString().slice(0, 10));
    }
  }, [departureDate, isReturn, returnDate]);

  const canSearch = useMemo(() => {
    if (!fromCode || !toCode || !departureDate) return false;
    if (isReturn && !returnDate) return false;
    return true;
  }, [departureDate, fromCode, isReturn, returnDate, toCode]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSearch) return;
        const params = new URLSearchParams({
          origin: fromCode,
          destination: toCode,
          departureDate,
          returnDate: isReturn ? returnDate : "",
          adults: "1"
        });
        router.push(`/search?${params.toString()}`);
      }}
    >
      <div className="mb-8 flex gap-6 border-b border-slate-200/70 pb-4">
        <button
          type="button"
          onClick={() => setTripType("RETURN")}
          className={clsx(
            "flex items-center gap-2 border-b-2 pb-2 px-1 text-sm font-headline transition-all",
            tripType === "RETURN"
              ? "border-black font-bold text-slate-900"
              : "border-transparent font-semibold text-slate-500 hover:text-slate-900"
          )}
        >
          <RefreshCw className="h-4 w-4" strokeWidth={2} />
          Return
        </button>
        <button
          type="button"
          onClick={() => setTripType("ONE_WAY")}
          className={clsx(
            "flex items-center gap-2 border-b-2 pb-2 px-1 text-sm font-headline transition-all",
            tripType === "ONE_WAY"
              ? "border-black font-bold text-slate-900"
              : "border-transparent font-semibold text-slate-500 hover:text-slate-900"
          )}
        >
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
          One Way
        </button>
      </div>

      <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-5">
        <AirportField
          label="Departure City"
          value={from}
          onChange={(value) => {
            setFrom(value);
            setFromCode("");
          }}
          onSelect={(option) => {
            setFrom(`${option.city || option.name}, ${option.iataCode}`);
            setFromCode(option.iataCode);
          }}
          icon={PlaneTakeoff}
          placeholder="London, LHR"
        />

        <AirportField
          label="Destination"
          value={to}
          onChange={(value) => {
            setTo(value);
            setToCode("");
          }}
          onSelect={(option) => {
            setTo(`${option.city || option.name}, ${option.iataCode}`);
            setToCode(option.iataCode);
          }}
          icon={PlaneLanding}
          placeholder="Tokyo, HND"
        />

        <DateField
          label="Departure Date"
          value={departureDate}
          onChange={setDepartureDate}
          min={today}
          placeholder="Oct 24, 2024"
          icon={CalendarDays}
        />

        <DateField
          label="Return Date"
          value={returnDate}
          onChange={setReturnDate}
          min={departureDate || today}
          placeholder="Oct 31, 2024"
          icon={CalendarDays}
          disabled={!isReturn}
        />

        <div className="lg:col-span-1">
          <button
            type="submit"
            disabled={!canSearch}
            className={clsx(
              "group flex w-full items-center justify-center gap-2 rounded-lg py-4 font-headline text-sm font-bold tracking-tight transition-all",
              canSearch
                ? "bg-black text-white hover:shadow-lg hover:shadow-black/20"
                : "cursor-not-allowed bg-slate-200 text-slate-500"
            )}
          >
            Generate Pass
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.3} />
          </button>
        </div>
      </div>
    </form>
  );
}

function DateField({
  label,
  value,
  onChange,
  min,
  placeholder,
  icon: Icon,
  disabled
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min: string;
  placeholder: string;
  icon: typeof CalendarDays;
  disabled?: boolean;
}) {
  return (
    <div className="lg:col-span-1">
      <label className="mb-2.5 block px-1 text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-500/80">
        {label}
      </label>
      <div className="flex items-center gap-3 rounded-lg border border-slate-200/80 bg-white p-3.5 transition-colors hover:border-slate-300">
        <Icon className="h-5 w-5 text-slate-500" strokeWidth={1.9} />
        <input
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          min={min}
          disabled={disabled}
          placeholder={placeholder}
          className={clsx(
            "w-full border-none bg-transparent p-0 text-sm font-semibold text-slate-900 outline-none",
            disabled && "opacity-50"
          )}
        />
      </div>
    </div>
  );
}
