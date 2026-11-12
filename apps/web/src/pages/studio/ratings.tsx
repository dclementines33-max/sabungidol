import { createFileRoute } from "@tanstack/react-router";
import { PanelPlaceholder } from "../../components/PanelPlaceholder";

export const Route = createFileRoute("/studio/ratings")({ component: PanelPlaceholder });
