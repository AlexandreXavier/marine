"use client";

import { Authenticated, Unauthenticated, useMutation, useQuery } from "convex/react";
import { SignInButton } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";

function FleetToggle({ mmsi }: { mmsi: number }) {
  const inFleet = useQuery(api.fleet.isInFleet, { mmsi });
  const toggle = useMutation(api.fleet.toggle);
  const active = inFleet === true;

  return (
    <button
      onClick={() => toggle({ mmsi })}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-[#136FD5] text-white"
          : "border border-[#136FD5] text-[#136FD5] hover:bg-[#136FD5]/5"
      }`}
    >
      <span aria-hidden>{active ? "♥" : "♡"}</span>
      {active ? "Na frota" : "Adicionar à frota"}
    </button>
  );
}

export function FleetButton({ mmsi }: { mmsi: number }) {
  return (
    <>
      <Authenticated>
        <FleetToggle mmsi={mmsi} />
      </Authenticated>
      <Unauthenticated>
        <SignInButton mode="modal">
          <button className="inline-flex items-center gap-1.5 rounded-full border border-[#136FD5] px-4 py-1.5 text-sm font-medium text-[#136FD5] hover:bg-[#136FD5]/5">
            <span aria-hidden>♡</span> Adicionar à frota
          </button>
        </SignInButton>
      </Unauthenticated>
    </>
  );
}
