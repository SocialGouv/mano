import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import API, { tryFetchExpectOk } from "../services/api";
import { capture } from "../services/sentry";
import { toast } from "react-toastify";

export default function IncrementorSmall({ service, team, date, count: initialValue, onUpdated, dataTestId, disabled = false, className = "" }) {
  const debounced = useDebouncedCallback(
    function updateServiceInDatabase() {
      if (value === initialValue || disabled) return;
      if (!date || !team || date === "undefined") {
        return capture("Missing params for initServices in IncrementorSmall", { extra: { date, team, service, initialValue } });
      }

      tryFetchExpectOk(async () => API.post({ path: `/service/team/${team}/date/${date}`, body: { count: value, service } })).then(([error, res]) => {
        if (error) {
          return toast.error("Erreur lors de la mise à jour du service");
        }
        onUpdated(res.data.count);
      });
    },
    import.meta.env.TEST === "true" ? 0 : 1000,
    { maxWait: 4000 }
  );

  const [value, setValue] = useState(initialValue);
  useEffect(() => setValue(initialValue), [initialValue]);
  useEffect(() => debounced(value), [debounced, value]);
  useEffect(
    () => () => {
      debounced.flush();
    },
    [debounced]
  );

  return (
    <div className={["tw-mb-2.5 tw-flex tw-gap-0.5 print:tw-max-w-sm", className].join(" ")}>
      <p id={`${service}-title`} className="tw-m-0 tw-flex-grow tw-text-black75">
        {service}
      </p>
      <button
        className="tw-my-auto tw-flex tw-w-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-main tw-bg-none tw-text-main hover:tw-bg-main hover:tw-text-white disabled:tw-cursor-not-allowed disabled:tw-border-gray-400 disabled:tw-bg-none disabled:tw-text-gray-400"
        aria-label="moins"
        disabled={disabled || value === 0}
        onClick={() => setValue(value - 1)}
        id={`${service}-remove`}
        type="button"
      >
        -
      </button>
      <input
        className="tw-mx-1 tw-w-10 tw-border-none tw-bg-none tw-text-center tw-text-black75"
        aria-label={`Nombre de ${service}`}
        min="0"
        id={`${service}-count`}
        data-test-id={dataTestId || `${service}-count`}
        // type="number"
        value={value}
        disabled={disabled}
        onChange={(e) => {
          if (!isNaN(Number(e.currentTarget.value))) {
            setValue(Number(e.currentTarget.value));
          }
        }}
      />
      <button
        className="tw-my-auto tw-flex tw-w-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-main tw-bg-none tw-text-main hover:tw-bg-main hover:tw-text-white disabled:tw-cursor-not-allowed disabled:tw-border-gray-400 disabled:tw-bg-none disabled:tw-text-gray-400"
        aria-label="plus"
        onClick={() => setValue(value + 1)}
        id={`${service}-add`}
        disabled={disabled}
        type="button"
      >
        +
      </button>
    </div>
  );
}
