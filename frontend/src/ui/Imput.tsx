import React from "react";

export default function Input(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full border rounded-lg px-3 py-2 outline-none focus:ring focus:ring-udo-steel ${className}`}
    />
  );
}
