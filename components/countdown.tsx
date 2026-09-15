"use client";

import React, { useSyncExternalStore } from "react";
import Countdown from "react-countdown";

const targetDate = new Date();
targetDate.setDate(targetDate.getDate() + 5);

const emptySubscribe = () => () => {};

const CountDown = () => {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!isClient) {
    return (
      <span className="font-bold text-5xl text-yellow-300">0d 00h 00m 00s</span>
    );
  }

  return (
    <Countdown
      date={targetDate}
      renderer={({ days, hours, minutes, seconds, completed }) =>
        completed ? (
          <span>Time&apos;s up!</span>
        ) : (
          <span className="font-bold text-5xl text-yellow-300">
            {days}d {hours}h {minutes}m {seconds}s
          </span>
        )
      }
    />
  );
};

export default CountDown;
