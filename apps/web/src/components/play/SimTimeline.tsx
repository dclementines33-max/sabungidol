// Simulation Timeline (2026-11-16 revamp, 2026-11-17 rework): after a bulk play, one view per competition just played (a
// tab each, or a dropdown when there are many; a review for a whole-season play). Full screen on an opaque backdrop, so
// the page behind (already showing the results) never spoils them. A league is a live broadcast — timeline + standings
// on one clock (LeagueTrack); a cup is a news page (TrackNews).
import type { Timeline } from "@sabung/engine";
import { Button, Modal, useIdolLookup } from "@sabung/ui";
import { useState } from "react";
import { useBranding } from "../../data/branding";
import { Tabs } from "../competition/Tabs";
import { Select } from "../idolDatabase/IdolFilters";
import { LeagueTrack } from "./LeagueTrack";
import { SeasonReview } from "./SeasonReview";
import { TrackNews } from "./TrackNews";
import { useSimTimeline } from "./timelineStore";

const TABS_UP_TO = 4;

export function SimTimeline() {
  const { items, close } = useSimTimeline();
  return items ? <Popup timelines={items} close={close} /> : null; // idol hooks only while open (the shell has no idol source in tests)
}

function Popup({ timelines, close }: { timelines: Timeline[]; close: () => void }) {
  const { label } = useBranding();
  const title = (t: Timeline) => (t.track ? label(t.track) : "Whole season");
  return (
    <Modal open onOpenChange={(open) => { if (!open) close(); }} title="Simulation highlights" description={timelines.length > 1 ? `${timelines.length} competitions` : title(timelines[0]!)} className="max-w-6xl" full
      footer={<Button variant="primary" onClick={close}>Close</Button>}>
      {timelines.length > TABS_UP_TO ? <Switcher timelines={timelines} title={title} />
        : timelines.length > 1 ? <Tabs label="Competition" tabs={timelines.map((t) => ({ id: t.track ?? "season", label: title(t), content: () => <Track key={t.track} t={t} /> }))} />
        : timelines[0]!.track === null ? <Review t={timelines[0]!} /> : <Track t={timelines[0]!} />}
    </Modal>
  );
}

// Many competitions (a whole league phase: 13): a dropdown instead of rows of tabs, which would fill a phone screen.
function Switcher({ timelines, title }: { timelines: Timeline[]; title: (t: Timeline) => string }) {
  const [pick, setPick] = useState(timelines[0]!.track!);
  const t = timelines.find((x) => x.track === pick)!;
  return (
    <div className="space-y-4">
      <Select label="Competition" value={pick} onChange={setPick} options={timelines.map((x): [string, string] => [x.track!, title(x)])} />
      <Track key={pick} t={t} />
    </div>
  );
}

// A whole-season play: the season review, not a track.
function Review({ t }: { t: Timeline }) {
  const { label } = useBranding();
  const lookup = useIdolLookup();
  return <SeasonReview t={t} name={(id) => lookup(id)?.name ?? id} label={label} />;
}

// A league (it has matchdays) plays as a live broadcast with standings; a cup reads as a news page.
const Track = ({ t }: { t: Timeline }) => (t.points.some((p) => p.stage === "LG") ? <LeagueTrack t={t} /> : <TrackNews t={t} />);
