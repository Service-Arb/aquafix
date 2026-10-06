import type { JobId } from "@/entities/content";

/**
 * Each job's line icon on the lead form's cards (`lead_form` `c`), drawn from
 * the Figma sketches (Aquafix file, node 56:850): 24px, a 1.75 stroke in the
 * surrounding colour. Inline rather than an icon package: nine paths do not
 * earn a dependency.
 */
const PATHS: Record<JobId, readonly string[]> = {
  blocked_drain: ["M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z", "M8 10H16M7.5 13H16.5M9 16H15"],
  burst_pipe: ["M3 12H9M15 12H21M9 9V15M15 9V15M12 7V9M9.8 5L10.7 6.6M14.2 5L13.3 6.6"],
  hot_water: [
    "M12 3C13 7 17 8.5 17 13C17 14.3261 16.4732 15.5979 15.5355 16.5355C14.5979 17.4732 13.3261 18 12 18C10.6739 18 9.40215 17.4732 8.46447 16.5355C7.52678 15.5979 7 14.3261 7 13C7 10.5 8.5 9 9.5 8C10 10 11 11 12 11C11 8 12 5 12 3Z",
  ],
  tap_toilet: ["M4 10H13C13.7956 10 14.5587 10.3161 15.1213 10.8787C15.6839 11.4413 16 12.2044 16 13V15M8 10V6M5 6H11M16 18.5V19M16 21V21.01"],
  sewer_line: [
    "M17 4H7C5.34315 4 4 5.34315 4 7V17C4 18.6569 5.34315 20 7 20H17C18.6569 20 20 18.6569 20 17V7C20 5.34315 18.6569 4 17 4Z",
    "M8.5 4V20M12 4V20M15.5 4V20",
  ],
  leak_detection: [
    "M10 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z",
    "M14.5 14.5L20 20M10 7C10 7 12 9.2 12 10.5C12 11.0304 11.7893 11.5391 11.4142 11.9142C11.0391 12.2893 10.5304 12.5 10 12.5C9.46957 12.5 8.96086 12.2893 8.58579 11.9142C8.21071 11.5391 8 11.0304 8 10.5C8 9.2 10 7 10 7Z",
  ],
  repipe: ["M4 6H12C13.0609 6 14.0783 6.42143 14.8284 7.17157C15.5786 7.92172 16 8.93913 16 10V20M4 4V8M14 20H18"],
  fit_out: [
    "M6 12V6C6 5.46957 6.21071 4.96086 6.58579 4.58579C6.96086 4.21071 7.46957 4 8 4C8.53043 4 9.03914 4.21071 9.41421 4.58579C9.78929 4.96086 10 5.46957 10 6M7 19L6 21M17 19L18 21M3 12H21V14C21 15.3261 20.4732 16.5979 19.5355 17.5355C18.5979 18.4732 17.3261 19 16 19H8C6.67392 19 5.40215 18.4732 4.46447 17.5355C3.52678 16.5979 3 15.3261 3 14V12Z",
  ],
  other: ["M6 13.2a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z", "M12 13.2a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z", "M18 13.2a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z"],
};

export function JobIcon({ job }: { job: JobId }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[job].map(d => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
