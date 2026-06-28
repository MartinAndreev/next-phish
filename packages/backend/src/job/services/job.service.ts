import type { JobView } from "../types";

export class JobService {
  toView(row: JobView): JobView {
    return row;
  }
}
