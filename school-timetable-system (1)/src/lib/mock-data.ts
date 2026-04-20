import announcementSports from "@/assets/announcement-sports.jpg";
import announcementLibrary from "@/assets/announcement-library.jpg";
import announcementMeeting from "@/assets/announcement-meeting.jpg";

export interface Session {
  id: number;
  className: string;
  subjectName: string;
  teacherName: string;
  classroomName: string;
  startTime: string;
  endTime: string;
  isTemporary: boolean;
}

export interface Announcement {
  id: number;
  imageUrl: string;
  title?: string;
  description?: string;
}

export const mockSessions: Session[] = [
  {
    id: 1,
    className: "Year 7A",
    subjectName: "Mathematics",
    teacherName: "Mr. J. Habimana",
    classroomName: "Room 12",
    startTime: "08:00",
    endTime: "09:30",
    isTemporary: false,
  },
  {
    id: 2,
    className: "Year 7B",
    subjectName: "English",
    teacherName: "Ms. A. Uwimana",
    classroomName: "Room 8",
    startTime: "08:00",
    endTime: "09:30",
    isTemporary: false,
  },
  {
    id: 3,
    className: "Year 8A",
    subjectName: "Physics",
    teacherName: "Dr. P. Mugabo",
    classroomName: "Science Lab",
    startTime: "08:00",
    endTime: "09:30",
    isTemporary: true,
  },
  {
    id: 4,
    className: "Year 8B",
    subjectName: "Geography",
    teacherName: "Mrs. C. Ingabire",
    classroomName: "Room 15",
    startTime: "08:00",
    endTime: "09:30",
    isTemporary: false,
  },
  {
    id: 5,
    className: "Year 9A",
    subjectName: "Chemistry",
    teacherName: "Mr. D. Niyonzima",
    classroomName: "Lab 2",
    startTime: "08:00",
    endTime: "09:30",
    isTemporary: false,
  },
  {
    id: 6,
    className: "Year 9B",
    subjectName: "History",
    teacherName: "Ms. F. Mukamana",
    classroomName: "Room 3",
    startTime: "08:00",
    endTime: "09:30",
    isTemporary: true,
  },
];

export const mockAnnouncements: Announcement[] = [
  {
    id: 1,
    imageUrl: announcementSports,
    title: "Sports Day Coming Soon",
    description: "Annual inter-house sports competition — Friday, April 18th. All students must participate.",
  },
  {
    id: 2,
    imageUrl: announcementLibrary,
    title: "Library Week",
    description: "Book exchange and reading challenge starts Monday. Visit the library to register.",
  },
  {
    id: 3,
    imageUrl: announcementMeeting,
    title: "Parent-Teacher Meeting",
    description: "Scheduled for April 25th, 2:00 PM – 5:00 PM. All parents are invited.",
  },
];
