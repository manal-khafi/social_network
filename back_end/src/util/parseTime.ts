export const parseTimeString = (timeString: string): number => {
  const time = parseInt(timeString.slice(0, -1));
  const unit = timeString.slice(-1);

  switch (unit) {
    case "s":
      return time;
    case "m":
      return time * 60;
    case "h":
      return time * 60 * 60;
    case "d":
      return time * 60 * 60 * 24;
    default:
      throw new Error("Invalid time string format");
  }
};
