import { useNavigate } from "react-router-dom";

interface Props {
    fallback?: string;
    label?: string;
    className?: string;
}

export const BackButton = ({
    fallback = "/projects",
    label = "Back",
    className = "",
}: Props) => {
    const navigate = useNavigate();

    const onClick = () => {
        // If there's meaningful history, go back; otherwise go to the fallback.
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate(fallback);
        }
    };

    return (
        <button
            onClick={onClick}
            className={`group inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-900 ${className}`}
            aria-label={label}
        >
            <svg
                className="h-4 w-4 transition group-hover:-translate-x-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                />
            </svg>
            {label}
        </button>
    );
};