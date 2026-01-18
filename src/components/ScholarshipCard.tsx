"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, Calendar } from "lucide-react";
import { Scholarship } from "@/lib/db-schema";

type ScholarshipCardData = Scholarship & {
  matchScore?: number;
  image?: string;
};

interface ScholarshipCardProps {
  scholarship: ScholarshipCardData;
}

export function ScholarshipCard({ scholarship }: ScholarshipCardProps) {
  const imageUrl = scholarship.image;
  const amountLabel = scholarship.amount
    ? `$${scholarship.amount.toLocaleString()}+`
    : "TBD";
  const deadlineLabel = scholarship.deadline
    ? new Date(scholarship.deadline).toLocaleDateString("en-CA")
    : "TBD";
  const matchScore = scholarship.matchScore;

  return (
    <Link
      href={`/scholarships/${String(scholarship._id)}`}
      className="group relative w-full h-80 sm:h-96 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-yellow-500/50 hover:-translate-y-3 hover:scale-[1.02] transition-all duration-700 cursor-pointer bg-gradient-to-br from-slate-50/80 to-white/80 border border-slate-200/50 backdrop-blur-xl hover:border-yellow-400/70"
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={scholarship.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-700"
          priority={false}
          unoptimized
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700/30 via-slate-900/20 to-black/40" />
      )}

      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.6)_30%,rgba(255,217,0,0.3)_50%,transparent_70%)] opacity-0 group-hover:opacity-100 bg-[length:300%_100%] bg-left bg-no-repeat transition-all duration-[1500ms] group-hover:bg-[position:400%_0]" />

      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent/0 opacity-0 group-hover:opacity-100 transition-all duration-[600ms]" />

      <div className="absolute inset-0 p-8 flex flex-col justify-end">
        <h3 className="text-white text-2xl sm:text-3xl font-bold drop-shadow-2xl mb-3 opacity-0 group-hover:opacity-100 translate-y-6 group-hover:translate-y-0 transition-all duration-700">
          {scholarship.title}
        </h3>

        <div className="flex flex-col sm:flex-row gap-4 opacity-0 group-hover:opacity-100 translate-y-6 group-hover:translate-y-0 transition-all duration-700">
          <div className="bg-gradient-to-r from-yellow-400/90 to-yellow-500/90 backdrop-blur-xl px-4 py-2 rounded-2xl text-slate-900 font-bold shadow-2xl border border-yellow-300/50 min-w-[100px] text-center">
            {amountLabel}
          </div>

          <div className="text-white/90 text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {deadlineLabel}
          </div>
        </div>

        {typeof matchScore === "number" && (
          <div className="mt-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
            <div className="bg-gradient-to-r from-yellow-400/95 to-orange-400/95 backdrop-blur-2xl px-6 py-3 rounded-2xl text-slate-900 font-bold text-lg shadow-2xl border border-yellow-300/60 flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              {matchScore}% Match
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 bg-white/90 hover:bg-white backdrop-blur-xl p-4 rounded-2xl shadow-2xl hover:shadow-white/50 border hover:border-yellow-400/50 hover:scale-110 transition-all duration-300 font-semibold"
        aria-label="Save scholarship"
      >
        <Bookmark className="h-5 w-5 text-slate-900" />
      </button>
    </Link>
  );
}
