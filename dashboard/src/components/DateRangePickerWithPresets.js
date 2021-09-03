/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import OutsideClickHandler from 'react-outside-click-handler';
import { DateRangePicker } from 'react-dates';
import moment from 'moment';

moment.locale('fr');

const getOffsetFromToday = (value, unit, end) => {
  const a = moment();
  const b = a.subtract(value, unit);
  return end ? b.endOf('day') : b.startOf('day');
};

const DateRangePickerWithPresets = ({ period, setPeriod }) => {
  const periods = [
    {
      label: 'Toutes les données',
      period: { startDate: null, endDate: null },
    },
    {
      label: "Aujourd'hui",
      period: { startDate: moment().startOf('day'), endDate: moment().endOf('day') },
    },
    {
      label: 'Hier',
      period: { startDate: getOffsetFromToday(1, 'day'), endDate: getOffsetFromToday(1, 'day', true) },
    },
    {
      label: 'Cette semaine',
      period: { startDate: moment().startOf('week'), endDate: moment().endOf('week') },
    },
    {
      label: 'Le semaine dernière',
      period: { startDate: moment().startOf('week').subtract(1, 'week'), endDate: moment().endOf('week').subtract(1, 'week') },
    },
    {
      label: 'Ce mois-ci',
      period: { startDate: moment().startOf('month'), endDate: moment().endOf('month') },
    },
    {
      label: 'Le mois dernier',
      period: { startDate: moment().subtract(1, 'month').startOf('month'), endDate: moment().subtract(1, 'month').endOf('month') },
    },
    {
      label: 'Les trois derniers mois',
      period: { startDate: moment().subtract(3, 'month').startOf('month'), endDate: moment().subtract(1, 'month').endOf('month') },
    },
    {
      label: 'Les six derniers mois',
      period: { startDate: moment().subtract(6, 'month').startOf('month'), endDate: moment().subtract(1, 'month').endOf('month') },
    },
    {
      label: 'Ce semestre',
      period: {
        startDate: moment().get('month') < 6 ? moment().startOf('year') : moment().startOf('year').add(6, 'month'),
        endDate: moment().get('month') < 6 ? moment().startOf('year').add(5, 'month').endOf('month') : moment().endOf('year'),
      },
    },
    {
      label: 'Le dernier semestre',
      period: {
        startDate: moment().get('month') < 6 ? moment().subtract(1, 'year').startOf('year').add(6, 'month') : moment().startOf('year'),
        endDate: moment().get('month') < 6 ? moment().subtract(1, 'year').endOf('year') : moment().startOf('year').add(5, 'month').endOf('month'),
      },
    },
    {
      label: 'Cette année',
      period: { startDate: moment().startOf('year'), endDate: moment().endOf('year') },
    },
    {
      label: "L'année dernière",
      period: { startDate: moment().subtract(1, 'year').startOf('year'), endDate: moment().subtract(1, 'year').endOf('year') },
    },
  ];

  const [showDatePicker, setShowDatepicker] = useState(true);
  const [preset, setPreset] = useState(null);
  const [datePickerFocused, setDatePickerFocused] = useState(null);

  useEffect(() => {
    if (!datePickerFocused) closeDatePicker();
  }, [datePickerFocused]);

  const openDatePicker = (event) => {
    setDatePickerFocused('startDate');
    if (!!showDatePicker) return event.preventDefault();
    setShowDatepicker(true);
  };

  const setPeriodRequest = (period) => {
    setPeriod(period);
    setPreset(null);
  };

  const closeDatePicker = () => {
    setTimeout(() => {
      setShowDatepicker(false);
      setDatePickerFocused(null);
    }, 50);
  };

  const setPresetRequest = (preset) => {
    setPreset(preset.label);
    setPeriod(preset.period);
    closeDatePicker();
  };

  const renderLabel = () => {
    if (!!preset) return preset;
    if (!!period.startDate && !!period.endDate) return `${moment(period.startDate).format('DD/MM/YYYY')} -> ${period.endDate.format('DD/MM/YYYY')}`;
    return `Entre... et le...`;
  };

  return (
    <Container>
      <Buttons>
        <OpenPickerButton onClick={openDatePicker}>{renderLabel()}</OpenPickerButton>
      </Buttons>
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
            <DateRangePicker
              startDateId="startDate"
              endDateId="endDate"
              startDatePlaceholderText="Entre..."
              endDatePlaceholderText="et le..."
              phrases={{ closeDatePicker: 'Fermer', clearDates: 'Effacer' }}
              startDate={period.startDate}
              endDate={period.endDate}
              onDatesChange={setPeriodRequest}
              focusedInput={datePickerFocused}
              onFocusChange={setDatePickerFocused}
              disabled={false}
              monthFormat="MMMM YYYY"
              showClearDates
              displayFormat="DD-MM-yyyy"
              isOutsideRange={() => null}
              hideKeyboardShortcutsPanel
            />
          </PickerContainer>
        </OutsideClickHandler>
      )}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
`;

const Buttons = styled.div`
  display: flex;
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
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  overflow-y: scroll;
  box-sizing: border-box;
  height: 100%;
  button:first-child {
    margin-top: 150px;
  }
  button:last-child {
    margin-bottom: 50px;
  }
`;

const PresetButton = styled.button`
  margin: 5px 15px;
  border: none;
  background-color: white;
  width: 12em;
  border-radius: 8px;
  :hover {
    background-color: #f2f6ff;
  }
`;

const PickerContainer = styled.div`
  position: absolute;
  z-index: 1000;
  top: 50px;
  left: -100px;
  min-width: 40em;
  height: 25em;
  padding: 25px;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 6px 0 #d5d0d7;
  display: flex;

  .DateRangePickerInput {
    border: none;
    padding-right: 0px;
  }
  .DateRangePickerInput > * {
    display: none;
  }

  .DateRangePicker_picker {
    display: block;
    border: none;
    position: relative;
    top: unset !important;
  }

  .DayPicker__withBorder {
    box-shadow: none;
    border: none;
  }
`;

export default DateRangePickerWithPresets;
