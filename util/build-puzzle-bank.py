#!/usr/bin/env python3

import os

SRC_DIR = "raw"
OUT_DIR = "public"

TIERS = ["easy", "medium", "hard", "diabolical"]

COUNT_PER_TIER = 10000

def pack_puzzle(puzzle_str: str) -> bytes: 
    out = bytearray(41)
    for i, ch in enumerate(puzzle_str):
        digit = 0 if ch in ('.', '0') else int(ch)
        byte_idx = i // 2
        if i % 2 == 0: out[byte_idx] = digit << 4
        else: out[byte_idx] |= digit

    return bytes(out)

def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    for tier in TIERS:
        src_path = os.path.join(SRC_DIR, f"{tier}.txt")
        out_path = os.path.join(OUT_DIR, f"{tier}.bin")

        with open(src_path, "r") as src, open(out_path, "wb") as out:
            count = 0
            for line in src:
                if count >= COUNT_PER_TIER: break
                puzzle_str = line[13:94]
                if len(puzzle_str) != 81: continue
                out.write(pack_puzzle(puzzle_str))
                count += 1

            size_kb = os.path.getsize(outpath)
            print(f"{tier}: wrote {count} puzzles -> {out_path} ({size_kb:.1f} KB)")

if __name__=="__main__": main()

