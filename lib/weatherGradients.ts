export const weatherGradients: Record<string, [string, string]> = {
    // Clear sky
    "01d": ["#FDE68A", "#F59E0B"], // day: žuto-narandžasti
    "01n": ["#1E3A8A", "#111827"], // night: tamno-plavi

    // Few clouds / scattered / broken
    "02d": ["#93C5FD", "#3B82F6"],
    "02n": ["#1E40AF", "#312E81"],
    "03d": ["#93C5FD", "#3B82F6"],
    "03n": ["#1E40AF", "#312E81"],
    "04d": ["#93C5FD", "#3B82F6"],
    "04n": ["#1E40AF", "#312E81"],

    // Rain, thunderstorm, snow, mist → sve plavo-sivo
    "09d": ["#60A5FA", "#2563EB"],
    "09n": ["#1E3A8A", "#1E40AF"],
    "10d": ["#3B82F6", "#1D4ED8"],
    "10n": ["#1E40AF", "#1E3A8A"],
    "11d": ["#6366F1", "#312E81"],
    "11n": ["#4338CA", "#111827"],
    "13d": ["#E5E7EB", "#9CA3AF"],
    "13n": ["#9CA3AF", "#4B5563"],
    "50d": ["#CBD5E1", "#64748B"],
    "50n": ["#64748B", "#1E293B"],

    // Fallback
    "default": ["#10B981", "#059669"],
};
