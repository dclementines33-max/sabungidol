import { createFileRoute } from "@tanstack/react-router";
import { PanelPlaceholder } from "../../components/PanelPlaceholder";

export const Route = createFileRoute("/wiki/seasons")({ component: PanelPlaceholder });
