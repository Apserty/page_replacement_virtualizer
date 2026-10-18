"""
Page Replacement Algorithms Engine (Python Module)
Principles of Operating Systems Project

Implements pure simulation logic for:
- FIFO (First-In, First-Out)
- LRU (Least Recently Used)
- Optimal (Belady's Min Algorithm)
"""

def simulate_fifo(reference_string, frame_count):
    frames = [None] * frame_count
    fifo_queue = []  # Stores frame slot indices in order of arrival
    steps = []
    total_hits = 0
    total_faults = 0

    for step_index, page in enumerate(reference_string):
        if page in frames:
            total_hits += 1
            hit_index = frames.index(page)
            steps.append({
                "stepIndex": step_index,
                "page": page,
                "isHit": True,
                "frames": list(frames),
                "victimPage": None,
                "victimFrameIndex": hit_index,
                "reason": f"Page {page} is already in Frame {hit_index}. (PAGE HIT)"
            })
        else:
            total_faults += 1
            if None in frames:
                empty_index = frames.index(None)
                frames[empty_index] = page
                fifo_queue.append(empty_index)
                steps.append({
                    "stepIndex": step_index,
                    "page": page,
                    "isHit": False,
                    "frames": list(frames),
                    "victimPage": None,
                    "victimFrameIndex": empty_index,
                    "reason": f"Page {page} caused a PAGE FAULT. Loaded into empty Frame {empty_index}."
                })
            else:
                victim_frame_index = fifo_queue.pop(0)
                victim_page = frames[victim_frame_index]
                frames[victim_frame_index] = page
                fifo_queue.append(victim_frame_index)
                steps.append({
                    "stepIndex": step_index,
                    "page": page,
                    "isHit": False,
                    "frames": list(frames),
                    "victimPage": victim_page,
                    "victimFrameIndex": victim_frame_index,
                    "reason": f"Page {page} caused a PAGE FAULT. Frames full. Evicted oldest Page {victim_page} from Frame {victim_frame_index} (FIFO order)."
                })

    total_requests = len(reference_string)
    hit_ratio = round((total_hits / total_requests) * 100, 1) if total_requests > 0 else 0
    fault_ratio = round((total_faults / total_requests) * 100, 1) if total_requests > 0 else 0

    return {
        "algorithm": "FIFO",
        "referenceString": reference_string,
        "frameCount": frame_count,
        "totalRequests": total_requests,
        "totalHits": total_hits,
        "totalFaults": total_faults,
        "hitRatio": hit_ratio,
        "faultRatio": fault_ratio,
        "steps": steps
    }


def simulate_lru(reference_string, frame_count):
    frames = [None] * frame_count
    last_used = {}  # page -> step_index
    steps = []
    total_hits = 0
    total_faults = 0

    for step_index, page in enumerate(reference_string):
        if page in frames:
            total_hits += 1
            last_used[page] = step_index
            hit_index = frames.index(page)
            steps.append({
                "stepIndex": step_index,
                "page": page,
                "isHit": True,
                "frames": list(frames),
                "victimPage": None,
                "victimFrameIndex": hit_index,
                "reason": f"Page {page} is already in Frame {hit_index}. (PAGE HIT - Last used step updated to {step_index + 1})"
            })
        else:
            total_faults += 1
            if None in frames:
                empty_index = frames.index(None)
                frames[empty_index] = page
                last_used[page] = step_index
                steps.append({
                    "stepIndex": step_index,
                    "page": page,
                    "isHit": False,
                    "frames": list(frames),
                    "victimPage": None,
                    "victimFrameIndex": empty_index,
                    "reason": f"Page {page} caused a PAGE FAULT. Loaded into empty Frame {empty_index}."
                })
            else:
                # Find frame whose page has minimum last_used value
                victim_frame_index = 0
                oldest_step = float("inf")
                for i in range(frame_count):
                    resident = frames[i]
                    used_step = last_used.get(resident, -1)
                    if used_step < oldest_step:
                        oldest_step = used_step
                        victim_frame_index = i

                victim_page = frames[victim_frame_index]
                frames[victim_frame_index] = page
                last_used[page] = step_index

                steps.append({
                    "stepIndex": step_index,
                    "page": page,
                    "isHit": False,
                    "frames": list(frames),
                    "victimPage": victim_page,
                    "victimFrameIndex": victim_frame_index,
                    "reason": f"Page {page} caused a PAGE FAULT. Frames full. Evicted Page {victim_page} from Frame {victim_frame_index} (least recently referenced at step {oldest_step + 1})."
                })

    total_requests = len(reference_string)
    hit_ratio = round((total_hits / total_requests) * 100, 1) if total_requests > 0 else 0
    fault_ratio = round((total_faults / total_requests) * 100, 1) if total_requests > 0 else 0

    return {
        "algorithm": "LRU",
        "referenceString": reference_string,
        "frameCount": frame_count,
        "totalRequests": total_requests,
        "totalHits": total_hits,
        "totalFaults": total_faults,
        "hitRatio": hit_ratio,
        "faultRatio": fault_ratio,
        "steps": steps
    }


def simulate_optimal(reference_string, frame_count):
    frames = [None] * frame_count
    steps = []
    total_hits = 0
    total_faults = 0

    for step_index, page in enumerate(reference_string):
        if page in frames:
            total_hits += 1
            hit_index = frames.index(page)
            steps.append({
                "stepIndex": step_index,
                "page": page,
                "isHit": True,
                "frames": list(frames),
                "victimPage": None,
                "victimFrameIndex": hit_index,
                "reason": f"Page {page} is already in Frame {hit_index}. (PAGE HIT)"
            })
        else:
            total_faults += 1
            if None in frames:
                empty_index = frames.index(None)
                frames[empty_index] = page
                steps.append({
                    "stepIndex": step_index,
                    "page": page,
                    "isHit": False,
                    "frames": list(frames),
                    "victimPage": None,
                    "victimFrameIndex": empty_index,
                    "reason": f"Page {page} caused a PAGE FAULT. Loaded into empty Frame {empty_index}."
                })
            else:
                victim_frame_index = 0
                furthest_next_use = -1

                for i in range(frame_count):
                    resident = frames[i]
                    next_use = float("inf")
                    for k in range(step_index + 1, len(reference_string)):
                        if reference_string[k] == resident:
                            next_use = k
                            break

                    if next_use > furthest_next_use:
                        furthest_next_use = next_use
                        victim_frame_index = i

                victim_page = frames[victim_frame_index]
                frames[victim_frame_index] = page

                next_use_desc = "not referenced again in future" if furthest_next_use == float("inf") else f"not referenced until step {furthest_next_use + 1}"
                steps.append({
                    "stepIndex": step_index,
                    "page": page,
                    "isHit": False,
                    "frames": list(frames),
                    "victimPage": victim_page,
                    "victimFrameIndex": victim_frame_index,
                    "reason": f"Page {page} caused a PAGE FAULT. Frames full. Evicted Page {victim_page} from Frame {victim_frame_index} ({next_use_desc})."
                })

    total_requests = len(reference_string)
    hit_ratio = round((total_hits / total_requests) * 100, 1) if total_requests > 0 else 0
    fault_ratio = round((total_faults / total_requests) * 100, 1) if total_requests > 0 else 0

    return {
        "algorithm": "OPTIMAL",
        "referenceString": reference_string,
        "frameCount": frame_count,
        "totalRequests": total_requests,
        "totalHits": total_hits,
        "totalFaults": total_faults,
        "hitRatio": hit_ratio,
        "faultRatio": fault_ratio,
        "steps": steps
    }


def run_page_replacement(algorithm, reference_string, frame_count):
    algo = (algorithm or "").upper()
    if algo == "FIFO":
        return simulate_fifo(reference_string, frame_count)
    elif algo == "LRU":
        return simulate_lru(reference_string, frame_count)
    elif algo == "OPTIMAL":
        return simulate_optimal(reference_string, frame_count)
    else:
        raise ValueError(f"Unsupported algorithm: {algorithm}")
