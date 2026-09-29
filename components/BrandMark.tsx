export default function BrandMark() {
    return (
        <svg className="brand-mark" viewBox="0 0 40 36" aria-hidden="true">
            <path
                className="brand-mark__back"
                d="M8 8.5h15a4.5 4.5 0 0 1 4.5 4.5v8a4.5 4.5 0 0 1-4.5 4.5h-7l-5 4v-4H8A4.5 4.5 0 0 1 3.5 21v-8A4.5 4.5 0 0 1 8 8.5Z"
            />
            <path
                className="brand-mark__front"
                d="M15 3.5h17A4.5 4.5 0 0 1 36.5 8v10A4.5 4.5 0 0 1 32 22.5h-2v5l-6-5h-9A4.5 4.5 0 0 1 10.5 18V8A4.5 4.5 0 0 1 15 3.5Z"
            />
            <circle className="brand-mark__dot" cx="18" cy="13" r="1.4" />
            <circle className="brand-mark__dot" cx="23.5" cy="13" r="1.4" />
            <circle className="brand-mark__dot" cx="29" cy="13" r="1.4" />
        </svg>
    );
}