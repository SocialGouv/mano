import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import OutsideClickHandler from 'react-outside-click-handler';
import DatePicker from 'react-datepicker';
import { dayjsInstance, dateForDatePicker } from '../services/date';
import { theme } from '../config';
import { useLocalStorage } from 'react-use';

const getOffsetFromToday = (value, unit, end) => {
  const a = dayjsInstance();
  const b = a.subtract(value, unit);
  return end ? b.endOf('day') : b.startOf('day');
};

const periods = [
  {
    label: 'Toutes les données',
    period: { startDate: null, endDate: null },
  },
  {
    label: "Aujourd'hui",
    period: { startDate: dayjsInstance().startOf('day'), endDate: dayjsInstance().endOf('day') },
  },
  {
    label: 'Hier',
    period: { startDate: getOffsetFromToday(1, 'day'), endDate: getOffsetFromToday(1, 'day', true) },
  },
  {
    label: 'Cette semaine',
    period: { startDate: dayjsInstance().startOf('week'), endDate: dayjsInstance().endOf('week') },
  },
  {
    label: 'La semaine dernière',
    period: { startDate: dayjsInstance().startOf('week').subtract(1, 'week'), endDate: dayjsInstance().endOf('week').subtract(1, 'week') },
  },
  {
    label: 'Ce mois-ci',
    period: { startDate: dayjsInstance().startOf('month'), endDate: dayjsInstance().endOf('month') },
  },
  {
    label: 'Le mois dernier',
    period: { startDate: dayjsInstance().subtract(1, 'month').startOf('month'), endDate: dayjsInstance().subtract(1, 'month').endOf('month') },
  },
  {
    label: 'Les trois derniers mois',
    period: { startDate: dayjsInstance().subtract(3, 'month').startOf('month'), endDate: dayjsInstance().subtract(1, 'month').endOf('month') },
  },
  {
    label: 'Les six derniers mois',
    period: { startDate: dayjsInstance().subtract(6, 'month').startOf('month'), endDate: dayjsInstance().subtract(1, 'month').endOf('month') },
  },
  {
    label: 'Ce semestre',
    period: {
      startDate: dayjsInstance().get('month') < 6 ? dayjsInstance().startOf('year') : dayjsInstance().startOf('year').add(6, 'month'),
      endDate: dayjsInstance().get('month') < 6 ? dayjsInstance().startOf('year').add(5, 'month').endOf('month') : dayjsInstance().endOf('year'),
    },
  },
  {
    label: 'Le dernier semestre',
    period: {
      startDate:
        dayjsInstance().get('month') < 6 ? dayjsInstance().subtract(1, 'year').startOf('year').add(6, 'month') : dayjsInstance().startOf('year'),
      endDate:
        dayjsInstance().get('month') < 6
          ? dayjsInstance().subtract(1, 'year').endOf('year')
          : dayjsInstance().startOf('year').add(5, 'month').endOf('month'),
    },
  },
  {
    label: 'Cette année',
    period: { startDate: dayjsInstance().startOf('year'), endDate: dayjsInstance().endOf('year') },
  },
  {
    label: "L'année dernière",
    period: { startDate: dayjsInstance().subtract(1, 'year').startOf('year'), endDate: dayjsInstance().subtract(1, 'year').endOf('year') },
  },
];

// https://reactdatepicker.com/#example-date-range
const DateRangePickerWithPresets = ({ period, setPeriod }) => {
  const [showDatePicker, setShowDatepicker] = useState(false);
  const [preset, setPreset] = useLocalStorage('stats-date-preset', null);
  const [numberOfMonths, setNumberOfMonths] = useState(() => (window.innerWidth < 1100 ? 1 : 2));

  const handleWindowResize = useCallback(() => {
    setNumberOfMonths(window.innerWidth < 1100 ? 1 : 2);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  });

  const openDatePicker = (event) => {
    if (!!showDatePicker) return event.preventDefault();
    setShowDatepicker(true);
  };

  const onChange = (dates) => {
    const [startDate, endDate] = dates;
    setPeriod({
      startDate: dateForDatePicker(startDate),
      endDate: dateForDatePicker(endDate),
    });
    setPreset(null);
  };

  const closeDatePicker = () => {
    setShowDatepicker(false);
  };

  const setPresetRequest = (preset) => {
    setPreset(preset.label);
    setPeriod({
      startDate: dateForDatePicker(preset.period.startDate),
      endDate: dateForDatePicker(preset.period.endDate),
    });
    closeDatePicker();
  };

  const renderLabel = () => {
    if (!!preset) return preset;
    if (!!period.startDate && !!period.endDate) {
      const startFormatted = dayjsInstance(period.startDate).format('D MMM YYYY');
      const endFormatted = dayjsInstance(period.endDate).format('D MMM YYYY');
      if (startFormatted === endFormatted) return startFormatted;
      return `${startFormatted} -> ${endFormatted}`;
    }
    return `Entre... et le...`;
  };

  return (
    <Container>
      <OpenPickerButton onClick={openDatePicker}>{renderLabel()}</OpenPickerButton>
      {!!showDatePicker && (
        <OutsideClickHandler onOutsideClick={closeDatePicker}>
          <PickerContainer>
            <Presets>
              {periods.map((p) => (
                <PresetButton key={p.label} onClick={() => setPresetRequest(p)}>
                  {p.label}
                </PresetButton>
              ))}
            </Presets>
            <DatePicker
              monthsShown={numberOfMonths}
              selectsRange
              inline
              locale="fr"
              name="date"
              selected={dateForDatePicker(period.startDate)}
              onChange={onChange}
              startDate={dateForDatePicker(period.startDate)}
              endDate={dateForDatePicker(period.endDate)}
            />
          </PickerContainer>
        </OutsideClickHandler>
      )}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  min-width: 15rem;
`;

const OpenPickerButton = styled.button`
  padding: 5px 15px;
  border-radius: 8px;
  background-color: transparent;
  box-shadow: none;
  min-width: 15rem;
  border: 1px solid #ccc;
`;

const Presets = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  overflow-y: scroll;
  box-sizing: border-box;
  flex: 1;
  max-height: 100%;
  width: 14rem;
  top: 0px;
  left: 0px;
  bottom: 0px;
  margin-left: 0.4rem;
`;

const PresetButton = styled.button`
  padding: 5px;
  border: none;
  background-color: white;
  border-radius: 8px;
  text-align: center;
  width: 100%;
  :hover {
    background-color: ${theme.main25};
  }
`;

const PickerContainer = styled.div`
  position: absolute;
  z-index: 1000;
  top: 50px;
  @media (min-width: 1100px) {
    min-width: 45rem;
  }
  padding-left: 14rem;
  background-color: #fff;
  border-radius: 0.5rem;
  border: 1px solid #aeaeae;
  overflow-x: auto;
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-end;
  .react-datepicker {
    border: none;
    border-left: 1px solid #aeaeae;
    border-radius: 0px;
  }
  .react-datepicker__day--outside-month {
    opacity: 0.3;
  }
  .react-datepicker__day--in-range,
  .react-datepicker__day--selected,
  .react-datepicker__day--keyboard-selected,
  .react-datepicker__day--in-selecting-range {
    background-color: ${theme.main};
  }
  .react-datepicker__navigation-icon {
    font-size: 10px;
  }
`;

export default DateRangePickerWithPresets;
