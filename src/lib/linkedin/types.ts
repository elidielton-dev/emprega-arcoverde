export type LinkedInExperience = {
  company: string;
  position: string;
  startDate: Date;
  endDate?: Date | null;
  isCurrent: boolean;
  description?: string | null;
};

export type LinkedInEducation = {
  institution: string;
  course: string;
  level: string;
  startDate?: Date | null;
  endDate?: Date | null;
  status: string;
};

export type LinkedInCourse = {
  institution: string;
  title: string;
  completionDate?: Date | null;
  hours?: number | null;
};

export type LinkedInProfileData = {
  fullName?: string;
  headline?: string;
  summary?: string;
  locale?: string;
  pictureUrl?: string;
  email?: string;
  skills: string[];
  experiences: LinkedInExperience[];
  educations: LinkedInEducation[];
  courses: LinkedInCourse[];
  source: "api" | "pdf" | "text" | "metadata";
};
