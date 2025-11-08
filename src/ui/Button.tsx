interface ButtonProps {
  href?: string;
  children: React.ReactNode;
}
export default function Button({ href, children }: ButtonProps) {
  return (
    <a
      href={href}
      className="px-4 py-2 rounded-xl bg-udo-primary text-white font-medium hover:bg-blue-700 transition"
    >
      {children}
    </a>
  );
}
