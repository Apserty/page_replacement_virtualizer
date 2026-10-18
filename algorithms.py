"""
Page Replacement Algorithms Engine (Python Module)
Principles of Operating Systems Project

Implements pure simulation logic for:
- FIFO (First-In, First-Out)
- LRU (Least Recently Used)
- Optimal (Belady's Min Algorithm)

Includes full pedagogical explanation generation meeting the 8-section logical structure:
A. Step Title
B. What Happened?
C. Current Memory State
D. Why Did This Happen?
E. Algorithm Decision
F. Action Taken
G. Updated Memory
H. Running Statistics
"""

def describe_frames(frames):
    if not frames:
        return "all frames are empty"
    if all(f is None for f in frames):
        return "all frames are empty"

    parts = []
    for idx, val in enumerate(frames):
        if val is not None:
            parts.append(f"Frame {idx} contains page {val}")
        else:
            parts.append(f"Frame {idx} is empty")

    if len(parts) == 1:
        return parts[0]
    if len(parts) == 2:
        return f"{parts[0]} and {parts[1]}"
    return ", ".join(parts[:-1]) + ", and " + parts[-1]


def generate_step_explanation(
    algorithm,
    reference_string,
    frame_count,
    step_index,
    requested_page,
    frames_before,
    frames_after,
    is_hit,
    event_type,
    victim_page=None,
    victim_frame_index=0,
    cumulative_hits=0,
    cumulative_faults=0,
    replacement_metadata=None
):
    if replacement_metadata is None:
        replacement_metadata = {}

    step_number = step_index + 1
    total_requests = len(reference_string) if reference_string else step_number
    algo_norm = (algorithm or "FIFO").upper()
    total_processed = cumulative_hits + cumulative_faults
    
    # 2 decimal places precision
    hit_ratio = f"{(cumulative_hits / total_processed) * 100:.2f}" if total_processed > 0 else "0.00"
    fault_ratio = f"{(cumulative_faults / total_processed) * 100:.2f}" if total_processed > 0 else "0.00"

    # --- A. STEP TITLE & EVENT CLASSIFICATION ---
    step_title = f"Step {step_number} of {total_requests} — Page {requested_page}"
    if is_hit:
        event_type_title = "PAGE HIT"
        short_reason = f"Page {requested_page} is already in Frame {victim_frame_index}. (PAGE HIT)"
        audio_intro = f"Step {step_number}, Page {requested_page}, It is Page Hit."
    elif event_type == "FAULT_INITIAL" or victim_page is None:
        event_type_title = "PAGE FAULT — EMPTY FRAME AVAILABLE"
        short_reason = f"Page {requested_page} caused a PAGE FAULT. Loaded into empty Frame {victim_frame_index}."
        audio_intro = f"Step {step_number}, Page {requested_page}, It is Page Fault Because Empty Frame is available."
    else:
        event_type_title = "PAGE FAULT — PAGE REPLACEMENT REQUIRED"
        short_reason = f"Page {requested_page} caused a PAGE FAULT. Evicted Page {victim_page} from Frame {victim_frame_index}."
        audio_intro = f"Step {step_number}, Page {requested_page}, It is Page Fault Because Page Replacement is required."

    # --- B. WHAT HAPPENED? ---
    if is_hit:
        what_happened = f"The CPU requested page {requested_page}. This page is already in memory, so this is a page hit. No page needs to be loaded from secondary storage."
        what_happened_audio = f"The CPU requested page {requested_page}. This page is already in memory, so this is a page hit. No page needs to be loaded from secondary storage."
    elif event_type == "FAULT_INITIAL" or victim_page is None:
        what_happened = f"The CPU requested page {requested_page}, but it is not currently in memory. This is a page fault, so the operating system must load the page into memory."
        what_happened_audio = f"The CPU requested page {requested_page}, but it is not currently in memory. This is a page fault, so the operating system must load the page into memory."
    else:
        what_happened = f"The CPU requested page {requested_page}, but it is not currently in memory. This is a page fault, and all frames are full, so the operating system must replace an existing page to load page {requested_page}."
        what_happened_audio = f"The CPU requested page {requested_page}, but it is not currently in memory. This is a page fault, and all frames are full, so the operating system must replace an existing page to load page {requested_page}."

    # --- C. CURRENT MEMORY STATE ---
    before_desc = describe_frames(frames_before)
    current_memory = f"Before this request, {before_desc}."
    current_memory_audio = f"Before this request, {before_desc}."

    # --- D. WHY DID THIS HAPPEN? ---
    if is_hit:
        why_did_this_happen = f"Page {requested_page} is already resident in Frame {victim_frame_index}, allowing immediate CPU access without secondary storage delay."
        why_did_this_happen_audio = f"Page {requested_page} is already stored in Frame {victim_frame_index}, allowing immediate CPU access without secondary storage delay."
    elif event_type == "FAULT_INITIAL" or victim_page is None:
        why_did_this_happen = f"Page {requested_page} was not found in any frame, which causes a page fault. Because Frame {victim_frame_index} is currently empty, the operating system can place page {requested_page} directly into memory without removing any existing page."
        why_did_this_happen_audio = f"Page {requested_page} was not resident in any frame, causing a page fault. Because Frame {victim_frame_index} is currently empty, the operating system can load page {requested_page} directly without removing any existing page."
    else:
        why_did_this_happen = f"Page {requested_page} was not found in any frame, causing a page fault. Since all {frame_count} physical frames are currently occupied, an existing resident page must be chosen for removal."
        why_did_this_happen_audio = f"Page {requested_page} was not resident in any frame, causing a page fault. Because all {frame_count} frames are full, an existing resident page must be chosen for removal."

    # --- E. ALGORITHM DECISION ---
    if is_hit:
        if algo_norm == "FIFO":
            algo_decision = f"Under First-In, First-Out (FIFO), a page hit does not alter the arrival order of resident pages. Frame {victim_frame_index} keeps its current position in the arrival queue."
            algo_decision_audio = "Under First-In, First-Out, a page hit does not alter the arrival order of resident pages."
        elif algo_norm == "LRU":
            algo_decision = f"Under Least Recently Used (LRU), accessing page {requested_page} in Frame {victim_frame_index} updates its access timestamp to Step {step_number}, marking it as the most recently referenced page."
            algo_decision_audio = f"Under Least Recently Used, referencing page {requested_page} updates its access time to Step {step_number}, making it the most recently used page."
        elif algo_norm == "OPTIMAL":
            algo_decision = "Under Belady's Optimal algorithm, the requested page is already resident, so memory contents remain unchanged."
            algo_decision_audio = "Under Belady's Optimal algorithm, the requested page is already resident, so memory contents remain unchanged."
        else:
            algo_decision = f"Under {algo_norm}, the requested page is already present in Frame {victim_frame_index}."
            algo_decision_audio = f"Under {algo_norm}, the requested page is already resident in memory."
    elif event_type == "FAULT_INITIAL" or victim_page is None:
        if algo_norm == "FIFO":
            q_pos = replacement_metadata.get("queuePosition", len([f for f in frames_before if f is not None]) + 1)
            algo_decision = f"Under First-In, First-Out (FIFO), an empty frame is available, so no page replacement is required. Page {requested_page} is loaded into Frame {victim_frame_index} and placed at position {q_pos} in the arrival queue."
            algo_decision_audio = f"Under First-In, First-Out, an empty frame is available, so no page replacement is needed. Page {requested_page} is loaded into Frame {victim_frame_index}."
        elif algo_norm == "LRU":
            algo_decision = f"Under Least Recently Used (LRU), an empty frame is available, so no page replacement is required. Page {requested_page} is loaded into Frame {victim_frame_index} and its access time is recorded as Step {step_number}."
            algo_decision_audio = f"Under Least Recently Used, an empty frame is available, so no page replacement is needed. Page {requested_page} is loaded into Frame {victim_frame_index}."
        elif algo_norm == "OPTIMAL":
            algo_decision = f"Under Belady's Optimal algorithm, Frame {victim_frame_index} is empty, so no page replacement is needed. Page {requested_page} is directly allocated into Frame {victim_frame_index}."
            algo_decision_audio = f"Under Belady's Optimal algorithm, an empty frame is available, so no page replacement is needed. Page {requested_page} is loaded into Frame {victim_frame_index}."
        else:
            algo_decision = f"Under {algo_norm}, an empty frame is available, so page {requested_page} is allocated into Frame {victim_frame_index} without replacement."
            algo_decision_audio = f"Under {algo_norm}, an empty frame is available, so no page replacement is needed."
    else:
        if algo_norm == "FIFO":
            oldest_step = replacement_metadata.get("oldestArrivalStep", "an earlier step")
            algo_decision = f"Under First-In, First-Out (FIFO), the operating system replaces the resident page that arrived earliest in physical memory. Page {victim_page} in Frame {victim_frame_index} was loaded at Step {oldest_step}, making it the oldest resident page, so it is chosen as the victim."
            algo_decision_audio = f"Under First-In, First-Out, the page that entered memory earliest is replaced first. Page {victim_page} in Frame {victim_frame_index} arrived first at Step {oldest_step}, so it is chosen as the victim page."
        elif algo_norm == "LRU":
            oldest_access = replacement_metadata.get("oldestAccessStep", "an earlier step")
            algo_decision = f"Under Least Recently Used (LRU), the operating system replaces the resident page that has not been referenced for the longest time. Page {victim_page} in Frame {victim_frame_index} was last accessed at Step {oldest_access}, longer ago than any other resident page, so it is chosen as the victim."
            algo_decision_audio = f"Under Least Recently Used, the page that has not been used for the longest time is replaced. Page {victim_page} in Frame {victim_frame_index} was last accessed at Step {oldest_access}, longer ago than any other resident page, so it is chosen as the victim page."
        elif algo_norm == "OPTIMAL":
            furthest = replacement_metadata.get("furthestNextUse")
            if furthest == float("inf") or furthest is None:
                next_desc = f"Page {victim_page} will not be referenced again in the remaining reference string"
            else:
                next_desc = f"Page {victim_page} is not referenced until Step {furthest + 1}, which is further in the future than any other resident page"
            tie = replacement_metadata.get("tieBreaker")
            tie_str = f" ({tie})" if tie else ""
            algo_decision = f"Under Belady's Optimal algorithm, the operating system looks ahead at future requests. {next_desc}{tie_str}. Therefore, Frame {victim_frame_index} holding Page {victim_page} is selected for replacement."
            algo_decision_audio = f"Under Belady's Optimal algorithm, the operating system looks ahead at future requests. {next_desc}. Therefore, Frame {victim_frame_index} holding Page {victim_page} is chosen for replacement."
        else:
            algo_decision = f"Under {algo_norm}, Page {victim_page} in Frame {victim_frame_index} is chosen as the victim page according to the replacement strategy."
            algo_decision_audio = f"Under {algo_norm}, Page {victim_page} in Frame {victim_frame_index} is chosen as the victim page."

    # --- F. ACTION TAKEN ---
    if is_hit:
        action_taken = "No page was removed or loaded. Frame contents remain unchanged."
        action_taken_audio = "No page was removed or loaded. Memory contents remain unchanged."
    elif event_type == "FAULT_INITIAL" or victim_page is None:
        action_taken = f"Page {requested_page} was loaded into empty Frame {victim_frame_index}. No page was removed."
        action_taken_audio = f"Page {requested_page} was loaded into empty Frame {victim_frame_index}. No page was removed."
    else:
        action_taken = f"Page {victim_page} was removed from Frame {victim_frame_index}, and page {requested_page} was loaded into Frame {victim_frame_index}."
        action_taken_audio = f"Page {victim_page} was removed from Frame {victim_frame_index}, and page {requested_page} was loaded into Frame {victim_frame_index}."

    # --- G. UPDATED MEMORY ---
    after_desc = describe_frames(frames_after)
    updated_memory = f"After this request, {after_desc}."
    updated_memory_audio = f"After this request, {after_desc}."

    # --- H. RUNNING STATISTICS (Available in data model) ---
    running_stats = f"Running statistics: Total requests: {step_number}, Page hits: {cumulative_hits} ({hit_ratio}%), Page faults: {cumulative_faults} ({fault_ratio}%)."

    display_html = f"""
    <div class="explanation-sections">
      <div class="expl-section">
        <div class="expl-label">What Happened?</div>
        <div class="expl-text">{what_happened}</div>
      </div>
      <div class="expl-section">
        <div class="expl-label">Current Memory State</div>
        <div class="expl-text">{current_memory}</div>
      </div>
      <div class="expl-section">
        <div class="expl-label">Why Did This Happen?</div>
        <div class="expl-text">{why_did_this_happen}</div>
      </div>
      <div class="expl-section">
        <div class="expl-label">Algorithm Decision ({algo_norm})</div>
        <div class="expl-text">{algo_decision}</div>
      </div>
      <div class="expl-section">
        <div class="expl-label">Action Taken</div>
        <div class="expl-text">{action_taken}</div>
      </div>
      <div class="expl-section">
        <div class="expl-label">Updated Memory</div>
        <div class="expl-text">{updated_memory}</div>
      </div>
    </div>
    """

    display_text = "\n".join([
        f"[{step_title}] [{event_type_title}]",
        f"What Happened: {what_happened}",
        f"Current Memory State: {current_memory}",
        f"Why Did This Happen: {why_did_this_happen}",
        f"Algorithm Decision: {algo_decision}",
        f"Action Taken: {action_taken}",
        f"Updated Memory: {updated_memory}"
    ])

    audio_narration = " ".join([
        audio_intro,
        what_happened_audio,
        current_memory_audio,
        why_did_this_happen_audio,
        algo_decision_audio,
        action_taken_audio,
        updated_memory_audio
    ])

    return {
        "stepTitle": step_title,
        "eventTypeTitle": event_type_title,
        "title": event_type_title,
        "shortReason": short_reason,
        "displayHtml": display_html,
        "displayText": display_text,
        "audioNarration": audio_narration,
        "text": display_text,
        "explanation": display_text
    }


def simulate_fifo(reference_string, frame_count):
    frames = [None] * frame_count
    fifo_queue = []  # Stores frame slot indices in order of arrival
    arrival_step_map = {}
    steps = []
    total_hits = 0
    total_faults = 0

    for step_index, page in enumerate(reference_string):
        frames_before = list(frames)
        if page in frames:
            total_hits += 1
            hit_index = frames.index(page)
            q_pos = (fifo_queue.index(hit_index) + 1) if hit_index in fifo_queue else 1
            expl = generate_step_explanation(
                "FIFO", reference_string, frame_count, step_index, page,
                frames_before, list(frames), True, "HIT",
                victim_page=None, victim_frame_index=hit_index,
                cumulative_hits=total_hits, cumulative_faults=total_faults,
                replacement_metadata={"queuePosition": q_pos}
            )
            steps.append({
                "stepIndex": step_index,
                "page": page,
                "isHit": True,
                "eventType": "HIT",
                "framesBefore": frames_before,
                "frames": list(frames),
                "victimPage": None,
                "victimFrameIndex": hit_index,
                "cumulativeHits": total_hits,
                "cumulativeFaults": total_faults,
                "reason": expl["shortReason"],
                "explanation": expl["displayText"],
                "displayHtml": expl["displayHtml"],
                "audioNarration": expl["audioNarration"],
                "title": expl["eventTypeTitle"],
                "stepTitle": expl["stepTitle"],
                "eventTypeTitle": expl["eventTypeTitle"],
                "replacementMetadata": {"queuePosition": q_pos}
            })
        else:
            total_faults += 1
            if None in frames:
                empty_index = frames.index(None)
                frames[empty_index] = page
                fifo_queue.append(empty_index)
                arrival_step_map[empty_index] = step_index + 1
                expl = generate_step_explanation(
                    "FIFO", reference_string, frame_count, step_index, page,
                    frames_before, list(frames), False, "FAULT_INITIAL",
                    victim_page=None, victim_frame_index=empty_index,
                    cumulative_hits=total_hits, cumulative_faults=total_faults,
                    replacement_metadata={"queuePosition": len(fifo_queue)}
                )
                steps.append({
                    "stepIndex": step_index,
                    "page": page,
                    "isHit": False,
                    "eventType": "FAULT_INITIAL",
                    "framesBefore": frames_before,
                    "frames": list(frames),
                    "victimPage": None,
                    "victimFrameIndex": empty_index,
                    "cumulativeHits": total_hits,
                    "cumulativeFaults": total_faults,
                    "reason": expl["shortReason"],
                    "explanation": expl["displayText"],
                    "displayHtml": expl["displayHtml"],
                    "audioNarration": expl["audioNarration"],
                    "title": expl["eventTypeTitle"],
                    "stepTitle": expl["stepTitle"],
                    "eventTypeTitle": expl["eventTypeTitle"],
                    "replacementMetadata": {"queuePosition": len(fifo_queue)}
                })
            else:
                victim_frame_index = fifo_queue.pop(0)
                victim_page = frames[victim_frame_index]
                oldest_arrival_step = arrival_step_map.get(victim_frame_index, 1)

                frames[victim_frame_index] = page
                fifo_queue.append(victim_frame_index)
                arrival_step_map[victim_frame_index] = step_index + 1

                expl = generate_step_explanation(
                    "FIFO", reference_string, frame_count, step_index, page,
                    frames_before, list(frames), False, "FAULT_REPLACE",
                    victim_page=victim_page, victim_frame_index=victim_frame_index,
                    cumulative_hits=total_hits, cumulative_faults=total_faults,
                    replacement_metadata={"oldestArrivalStep": oldest_arrival_step}
                )
                steps.append({
                    "stepIndex": step_index,
                    "page": page,
                    "isHit": False,
                    "eventType": "FAULT_REPLACE",
                    "framesBefore": frames_before,
                    "frames": list(frames),
                    "victimPage": victim_page,
                    "victimFrameIndex": victim_frame_index,
                    "cumulativeHits": total_hits,
                    "cumulativeFaults": total_faults,
                    "reason": expl["shortReason"],
                    "explanation": expl["displayText"],
                    "displayHtml": expl["displayHtml"],
                    "audioNarration": expl["audioNarration"],
                    "title": expl["eventTypeTitle"],
                    "stepTitle": expl["stepTitle"],
                    "eventTypeTitle": expl["eventTypeTitle"],
                    "replacementMetadata": {"oldestArrivalStep": oldest_arrival_step}
                })

    total_requests = len(reference_string)
    hit_ratio = round((total_hits / total_requests) * 100, 2) if total_requests > 0 else 0.0
    fault_ratio = round((total_faults / total_requests) * 100, 2) if total_requests > 0 else 0.0

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
        frames_before = list(frames)
        if page in frames:
            total_hits += 1
            last_used[page] = step_index
            hit_index = frames.index(page)
            expl = generate_step_explanation(
                "LRU", reference_string, frame_count, step_index, page,
                frames_before, list(frames), True, "HIT",
                victim_page=None, victim_frame_index=hit_index,
                cumulative_hits=total_hits, cumulative_faults=total_faults,
                replacement_metadata={"lastUsedStep": step_index + 1}
            )
            steps.append({
                "stepIndex": step_index,
                "page": page,
                "isHit": True,
                "eventType": "HIT",
                "framesBefore": frames_before,
                "frames": list(frames),
                "victimPage": None,
                "victimFrameIndex": hit_index,
                "cumulativeHits": total_hits,
                "cumulativeFaults": total_faults,
                "reason": expl["shortReason"],
                "explanation": expl["displayText"],
                "displayHtml": expl["displayHtml"],
                "audioNarration": expl["audioNarration"],
                "title": expl["eventTypeTitle"],
                "stepTitle": expl["stepTitle"],
                "eventTypeTitle": expl["eventTypeTitle"],
                "replacementMetadata": {"lastUsedStep": step_index + 1}
            })
        else:
            total_faults += 1
            if None in frames:
                empty_index = frames.index(None)
                frames[empty_index] = page
                last_used[page] = step_index
                expl = generate_step_explanation(
                    "LRU", reference_string, frame_count, step_index, page,
                    frames_before, list(frames), False, "FAULT_INITIAL",
                    victim_page=None, victim_frame_index=empty_index,
                    cumulative_hits=total_hits, cumulative_faults=total_faults,
                    replacement_metadata={"lastUsedStep": step_index + 1}
                )
                steps.append({
                    "stepIndex": step_index,
                    "page": page,
                    "isHit": False,
                    "eventType": "FAULT_INITIAL",
                    "framesBefore": frames_before,
                    "frames": list(frames),
                    "victimPage": None,
                    "victimFrameIndex": empty_index,
                    "cumulativeHits": total_hits,
                    "cumulativeFaults": total_faults,
                    "reason": expl["shortReason"],
                    "explanation": expl["displayText"],
                    "displayHtml": expl["displayHtml"],
                    "audioNarration": expl["audioNarration"],
                    "title": expl["eventTypeTitle"],
                    "stepTitle": expl["stepTitle"],
                    "eventTypeTitle": expl["eventTypeTitle"],
                    "replacementMetadata": {"lastUsedStep": step_index + 1}
                })
            else:
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

                expl = generate_step_explanation(
                    "LRU", reference_string, frame_count, step_index, page,
                    frames_before, list(frames), False, "FAULT_REPLACE",
                    victim_page=victim_page, victim_frame_index=victim_frame_index,
                    cumulative_hits=total_hits, cumulative_faults=total_faults,
                    replacement_metadata={"oldestAccessStep": oldest_step + 1}
                )
                steps.append({
                    "stepIndex": step_index,
                    "page": page,
                    "isHit": False,
                    "eventType": "FAULT_REPLACE",
                    "framesBefore": frames_before,
                    "frames": list(frames),
                    "victimPage": victim_page,
                    "victimFrameIndex": victim_frame_index,
                    "cumulativeHits": total_hits,
                    "cumulativeFaults": total_faults,
                    "reason": expl["shortReason"],
                    "explanation": expl["displayText"],
                    "displayHtml": expl["displayHtml"],
                    "audioNarration": expl["audioNarration"],
                    "title": expl["eventTypeTitle"],
                    "stepTitle": expl["stepTitle"],
                    "eventTypeTitle": expl["eventTypeTitle"],
                    "replacementMetadata": {"oldestAccessStep": oldest_step + 1}
                })

    total_requests = len(reference_string)
    hit_ratio = round((total_hits / total_requests) * 100, 2) if total_requests > 0 else 0.0
    fault_ratio = round((total_faults / total_requests) * 100, 2) if total_requests > 0 else 0.0

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
        frames_before = list(frames)
        if page in frames:
            total_hits += 1
            hit_index = frames.index(page)
            expl = generate_step_explanation(
                "OPTIMAL", reference_string, frame_count, step_index, page,
                frames_before, list(frames), True, "HIT",
                victim_page=None, victim_frame_index=hit_index,
                cumulative_hits=total_hits, cumulative_faults=total_faults
            )
            steps.append({
                "stepIndex": step_index,
                "page": page,
                "isHit": True,
                "eventType": "HIT",
                "framesBefore": frames_before,
                "frames": list(frames),
                "victimPage": None,
                "victimFrameIndex": hit_index,
                "cumulativeHits": total_hits,
                "cumulativeFaults": total_faults,
                "reason": expl["shortReason"],
                "explanation": expl["displayText"],
                "displayHtml": expl["displayHtml"],
                "audioNarration": expl["audioNarration"],
                "title": expl["eventTypeTitle"],
                "stepTitle": expl["stepTitle"],
                "eventTypeTitle": expl["eventTypeTitle"]
            })
        else:
            total_faults += 1
            if None in frames:
                empty_index = frames.index(None)
                frames[empty_index] = page
                expl = generate_step_explanation(
                    "OPTIMAL", reference_string, frame_count, step_index, page,
                    frames_before, list(frames), False, "FAULT_INITIAL",
                    victim_page=None, victim_frame_index=empty_index,
                    cumulative_hits=total_hits, cumulative_faults=total_faults
                )
                steps.append({
                    "stepIndex": step_index,
                    "page": page,
                    "isHit": False,
                    "eventType": "FAULT_INITIAL",
                    "framesBefore": frames_before,
                    "frames": list(frames),
                    "victimPage": None,
                    "victimFrameIndex": empty_index,
                    "cumulativeHits": total_hits,
                    "cumulativeFaults": total_faults,
                    "reason": expl["shortReason"],
                    "explanation": expl["displayText"],
                    "displayHtml": expl["displayHtml"],
                    "audioNarration": expl["audioNarration"],
                    "title": expl["eventTypeTitle"],
                    "stepTitle": expl["stepTitle"],
                    "eventTypeTitle": expl["eventTypeTitle"]
                })
            else:
                victim_frame_index = 0
                furthest_next_use = -1
                ties = []

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
                        ties = [i]
                    elif next_use == furthest_next_use:
                        ties.append(i)

                victim_page = frames[victim_frame_index]
                frames[victim_frame_index] = page

                next_use_desc = (
                    "Page " + str(victim_page) + " will not be referenced again in the remaining reference string"
                    if furthest_next_use == float("inf")
                    else f"Page {victim_page} is not referenced until Step {furthest_next_use + 1}, which is further in the future than any other resident page"
                )
                tie_breaker = "lowest frame index chosen as tie-breaker" if len(ties) > 1 else None

                expl = generate_step_explanation(
                    "OPTIMAL", reference_string, frame_count, step_index, page,
                    frames_before, list(frames), False, "FAULT_REPLACE",
                    victim_page=victim_page, victim_frame_index=victim_frame_index,
                    cumulative_hits=total_hits, cumulative_faults=total_faults,
                    replacement_metadata={
                        "furthestNextUse": furthest_next_use,
                        "nextUseDesc": next_use_desc,
                        "tieBreaker": tie_breaker
                    }
                )

                steps.append({
                    "stepIndex": step_index,
                    "page": page,
                    "isHit": False,
                    "eventType": "FAULT_REPLACE",
                    "framesBefore": frames_before,
                    "frames": list(frames),
                    "victimPage": victim_page,
                    "victimFrameIndex": victim_frame_index,
                    "cumulativeHits": total_hits,
                    "cumulativeFaults": total_faults,
                    "reason": expl["shortReason"],
                    "explanation": expl["displayText"],
                    "displayHtml": expl["displayHtml"],
                    "audioNarration": expl["audioNarration"],
                    "title": expl["eventTypeTitle"],
                    "stepTitle": expl["stepTitle"],
                    "eventTypeTitle": expl["eventTypeTitle"],
                    "replacementMetadata": {
                        "furthestNextUse": furthest_next_use,
                        "nextUseDesc": next_use_desc,
                        "tieBreaker": tie_breaker
                    }
                })

    total_requests = len(reference_string)
    hit_ratio = round((total_hits / total_requests) * 100, 2) if total_requests > 0 else 0.0
    fault_ratio = round((total_faults / total_requests) * 100, 2) if total_requests > 0 else 0.0

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
