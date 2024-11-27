import "./index.css";
interface BeautifulButtonProps {
  color?: "green" | "red";
  children: React.ReactNode;
  onClick?: () => void;
}
export const MyButton = ({
  color = "green",
  onClick,
  children,
}: BeautifulButtonProps) => {
  const colorClasses = {
    green:
      "bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 focus:ring-green-300",
    red: "bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 focus:ring-red-300",
  };

  return (
    <button
      onClick={onClick}
      className={`px-8 py-6 text-2xl font-bold text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition duration-300 ease-in-out focus:outline-none focus:ring-4 active:scale-95 ${colorClasses[color]}`}
    >
      {children}
    </button>
  );
};
