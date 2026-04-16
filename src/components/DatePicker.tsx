import React, { useState, useRef, useEffect } from 'react';
import './DatePicker.css';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, placeholder = '' }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [view, setView] = useState<'calendar' | 'months' | 'years'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  const years: number[] = [];
  for (let year = 2000; year <= 2050; year++) {
    years.push(year);
  }

  const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    // 使用本地时间格式化，避免时区转换导致的日期偏移
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const formattedDate = `${year}-${month}-${dayStr}`;
    onChange(formattedDate);
    setShowPicker(false);
    setView('calendar');
  };

  const handleMonthClick = (month: number) => {
    const newDate = new Date(currentDate.getFullYear(), month, 1);
    setCurrentDate(newDate);
    setView('calendar');
  };

  const handleYearClick = (year: number) => {
    const newDate = new Date(year, currentDate.getMonth(), 1);
    setCurrentDate(newDate);
    setView('months');
  };

  const handleHeaderClick = () => {
    if (view === 'calendar') {
      setView('months');
    } else if (view === 'months') {
      setView('years');
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
    const days = [];

    // 填充空白
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="date-picker-day empty"></div>);
    }

    // 填充日期
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = selectedDate && dateStr === value;

      days.push(
        <div
          key={day}
          className={`date-picker-day ${isSelected ? 'selected' : ''}`}
          onClick={() => handleDateClick(day)}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  const renderMonths = () => {
    return months.map((month, index) => {
      const isCurrentMonth = currentDate.getMonth() === index && currentDate.getFullYear() === new Date().getFullYear();
      return (
        <div
          key={month}
          className={`date-picker-month ${isCurrentMonth ? 'current' : ''}`}
          onClick={() => handleMonthClick(index)}
        >
          {month}
        </div>
      );
    });
  };

  const renderYears = () => {
    return years.map(year => {
      const isCurrentYear = year === new Date().getFullYear();
      return (
        <div
          key={year}
          className={`date-picker-year ${isCurrentYear ? 'current' : ''}`}
          onClick={() => handleYearClick(year)}
        >
          {year}
        </div>
      );
    });
  };

  const handleTogglePicker = () => {
    if (!showPicker && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setPickerPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
    }
    setShowPicker(!showPicker);
  };

  // 点击外部关闭日期选择器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showPicker &&
        inputRef.current &&
        popupRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  return (
    <div className="date-picker-container">
      <input
        ref={inputRef}
        type="text"
        value={value || ''}
        readOnly
        placeholder={placeholder}
        className="date-picker-input"
        onClick={handleTogglePicker}
      />
      {showPicker && (
        <div ref={popupRef} className="date-picker-popup" style={{ top: `${pickerPosition.top}px`, left: `${pickerPosition.left}px` }}>
          <div className="date-picker-header">
            <button
              type="button"
              className="date-picker-nav"
              onClick={handlePrevMonth}
            >
              ‹
            </button>
            <button
              type="button"
              className="date-picker-title"
              onClick={handleHeaderClick}
            >
              {view === 'calendar' && (
                <>{`${currentDate.getFullYear()}年 ${months[currentDate.getMonth()]}`}</>
              )}
              {view === 'months' && (
                <>{`${currentDate.getFullYear()}年`}</>
              )}
              {view === 'years' && (
                <>选择年份</>
              )}
            </button>
            <button
              type="button"
              className="date-picker-nav"
              onClick={handleNextMonth}
            >
              ›
            </button>
          </div>
          <div className="date-picker-body">
            {view === 'calendar' && (
              <>
                <div className="date-picker-weekdays">
                  <div>日</div>
                  <div>一</div>
                  <div>二</div>
                  <div>三</div>
                  <div>四</div>
                  <div>五</div>
                  <div>六</div>
                </div>
                <div className="date-picker-days">
                  {renderCalendar()}
                </div>
              </>
            )}
            {view === 'months' && (
              <div className="date-picker-months">
                {renderMonths()}
              </div>
            )}
            {view === 'years' && (
              <div className="date-picker-years">
                {renderYears()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
