import React from "react";

export const MyInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className = "", type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base ring-offset-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${className}`}
      ref={ref}
      {...props}
    />
  );
});
