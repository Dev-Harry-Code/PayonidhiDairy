import "server-only";

import { cache } from "react";
import { getSettings as loadSettings } from "@/features/settings/service";

export const getSettings = cache(loadSettings);
