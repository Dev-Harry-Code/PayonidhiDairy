export type Language = "en" | "hi";

const strings = {
  en: {
    route: "Delivery route", today: "Today", customers: "Customers", logout: "Log out", english: "English", hindi: "हिन्दी",
    todaysRoute: "Today’s route", markAsYouGo: "Mark each delivery as you go. You can correct today and the previous two days.", loadDate: "Load date", morning: "Morning", evening: "Evening",
    progress: "Progress", complete: "complete", delivered: "Delivered", notDelivered: "Not delivered", unmarked: "Unmarked", markRemaining: "Mark remaining", saving: "Saving…", undo: "Undo mark", scheduled: "Scheduled", morningPending: "Morning pending", morningAdded: "Morning added", addMorning: "Add morning",
    suggestCustomer: "Suggest a new customer", submitDetails: "Submit their details. Admin will review and approve the account.", customerName: "Customer name", phone: "Phone", address: "Address", area: "Area", notes: "Notes", morningBottles: "Morning bottles", eveningBottles: "Evening bottles", eachBottle: "Each bottle is 1 litre.", sendInquiry: "Send inquiry", inquirySent: "Inquiry sent to admin for approval.", checkDetails: "Please check the details and try again.",
    leaveRequest: "Leave request", leaveDescription: "Submit dates when you will be absent. Admin approval will appear here.", from: "From", to: "To", reason: "Reason for leave", submitLeave: "Submit leave request", leaveSent: "Leave request sent to admin.", yourLeaveRequests: "Your leave requests", authenticated: "Authenticated", pending: "Pending", denied: "Denied", approved: "Approved", myCustomers: "My customers", viewMonth: "View month →", noCustomers: "No active customers assigned.", backCustomers: "← My customers", at: "at",
  },
  hi: {
    route: "डिलीवरी रूट", today: "आज", customers: "ग्राहक", logout: "लॉग आउट", english: "English", hindi: "हिन्दी",
    todaysRoute: "आज का रूट", markAsYouGo: "डिलीवरी करते जाएँ। आज और पिछले दो दिनों में सुधार कर सकते हैं।", loadDate: "तारीख लोड करें", morning: "सुबह", evening: "शाम",
    progress: "प्रगति", complete: "पूर्ण", delivered: "डिलीवर किया", notDelivered: "डिलीवर नहीं किया", unmarked: "अंकित नहीं", markRemaining: "बाकी अंकित करें", saving: "सेव हो रहा है…", undo: "चिह्न हटाएँ", scheduled: "निर्धारित", morningPending: "सुबह बाकी", morningAdded: "सुबह जोड़ा गया", addMorning: "सुबह जोड़ें",
    suggestCustomer: "नया ग्राहक सुझाएँ", submitDetails: "विवरण भेजें। एडमिन खाते की जाँच और मंज़ूरी करेगा।", customerName: "ग्राहक का नाम", phone: "फ़ोन", address: "पता", area: "क्षेत्र", notes: "नोट्स", morningBottles: "सुबह की बोतलें", eveningBottles: "शाम की बोतलें", eachBottle: "हर बोतल 1 लीटर है।", sendInquiry: "अनुरोध भेजें", inquirySent: "अनुरोध एडमिन की मंज़ूरी के लिए भेज दिया गया है।", checkDetails: "विवरण जाँचकर फिर प्रयास करें।",
    leaveRequest: "छुट्टी का अनुरोध", leaveDescription: "जिन तारीखों में आप अनुपस्थित रहेंगे वे भेजें। एडमिन की मंज़ूरी यहाँ दिखेगी।", from: "से", to: "तक", reason: "छुट्टी का कारण", submitLeave: "छुट्टी का अनुरोध भेजें", leaveSent: "छुट्टी का अनुरोध एडमिन को भेज दिया गया है।", yourLeaveRequests: "आपके छुट्टी अनुरोध", authenticated: "स्वीकृत", pending: "लंबित", denied: "अस्वीकृत", approved: "स्वीकृत", myCustomers: "मेरे ग्राहक", viewMonth: "महीना देखें →", noCustomers: "कोई सक्रिय ग्राहक assigned नहीं है।", backCustomers: "← मेरे ग्राहक", at: "समय",
  },
} as const;

export type TranslationKey = keyof typeof strings.en;
export function t(lang: Language, key: TranslationKey): string { return strings[lang][key] ?? strings.en[key]; }
