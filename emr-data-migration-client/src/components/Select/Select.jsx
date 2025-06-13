import React from "react";

const SelectComponent = ({ options, value, onChange, className }) => {
  return (
    <select className={className} value={value} onChange={onChange}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default SelectComponent;
