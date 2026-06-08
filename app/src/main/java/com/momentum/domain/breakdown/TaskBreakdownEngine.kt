package com.momentum.domain.breakdown

import com.momentum.domain.model.Task

/**
 * Turns a daunting task into a short list of concrete, low-friction steps.
 *
 * The contract is deliberately tiny so it can be backed by anything: the bundled
 * offline heuristic engine, or — by dropping in another implementation in
 * [com.momentum.MomentumApp] — a cloud LLM. The UI never knows the difference.
 */
fun interface TaskBreakdownEngine {
    suspend fun breakDown(task: Task): List<String>
}

/**
 * An offline, no-account-required breakdown engine tuned for ADHD avoidance.
 *
 * Principles baked in:
 *  - The first step is always tiny and physical ("just open it") to beat the
 *    activation barrier — momentum comes from starting, not from planning.
 *  - Steps are concrete and verb-led, never vague ("decide what to do").
 *  - The list stays short (3–6 steps) so it reads as doable, not as a project.
 */
class HeuristicBreakdownEngine : TaskBreakdownEngine {

    override suspend fun breakDown(task: Task): List<String> {
        val title = task.title.trim()
        val lower = title.lowercase()

        val steps = mutableListOf<String>()

        // 1. A two-minute activation step — the most important one for a stuck brain.
        steps += activationStep(lower, title)

        // 2. Domain-specific middle steps based on what the task looks like.
        steps += middleSteps(lower)

        // 3. A clear finish line so completion feels real.
        steps += finishStep(lower)

        // Slice long tasks into a couple of timed focus sprints instead of one slog.
        val estimate = task.estimatedMinutes ?: 0
        if (estimate >= 50) {
            steps.add(1, "Set a 25-minute timer and work only until it rings")
            steps.add(2, "Take a 5-minute break, then do one more 25-minute sprint")
        }

        return steps.distinct().take(6)
    }

    private fun activationStep(lower: String, title: String): String = when {
        lower.containsAny("email", "reply", "message", "respond") ->
            "Open your inbox and find the thread — don't reply yet"
        lower.containsAny("call", "phone", "ring") ->
            "Find the number and put the phone where you can see it"
        lower.containsAny("write", "draft", "report", "essay", "blog", "doc") ->
            "Open a blank doc and type just the title"
        lower.containsAny("clean", "tidy", "wash", "laundry", "dishes") ->
            "Set a 2-minute timer and clear just one surface"
        lower.containsAny("buy", "order", "shop", "groceries") ->
            "Open the shop/app and add the first item to the basket"
        lower.containsAny("read", "study", "review", "research") ->
            "Open it and read only the first paragraph"
        lower.containsAny("code", "fix", "bug", "build", "deploy") ->
            "Open the project and read the relevant file — no edits yet"
        lower.containsAny("pay", "invoice", "bill", "tax") ->
            "Gather the amount and the login in one place"
        lower.containsAny("book", "schedule", "appointment", "reserve") ->
            "Open the booking page and pick a rough date"
        else ->
            "Put \"${title.take(40)}\" on screen and look at it for 2 minutes"
    }

    private fun middleSteps(lower: String): List<String> = when {
        lower.containsAny("email", "reply", "message", "respond") -> listOf(
            "Write a one-line answer to the main question",
            "Add any details, then re-read once"
        )
        lower.containsAny("call", "phone", "ring") -> listOf(
            "Jot the 2–3 points you need to cover",
            "Make the call"
        )
        lower.containsAny("write", "draft", "report", "essay", "blog", "doc") -> listOf(
            "Bullet the 3 main points you want to make",
            "Turn each bullet into a rough sentence — messy is fine"
        )
        lower.containsAny("clean", "tidy", "wash", "laundry", "dishes") -> listOf(
            "Do the next surface, then the next",
            "Put away anything that has a clear home"
        )
        lower.containsAny("buy", "order", "shop", "groceries") -> listOf(
            "Add the rest of the items",
            "Check delivery/pickup and confirm"
        )
        lower.containsAny("read", "study", "research") -> listOf(
            "Read one section and note a single takeaway",
            "Decide the one thing to do with what you read"
        )
        lower.containsAny("code", "fix", "bug", "build", "deploy") -> listOf(
            "Reproduce the issue or write the smallest failing case",
            "Make the smallest change that could work, then test it"
        )
        lower.containsAny("plan", "organize", "prepare") -> listOf(
            "List everything on your mind about it — brain dump",
            "Pick the single most important item"
        )
        else -> listOf(
            "Do the most obvious next part for 10 minutes",
            "Notice what's left and pick the next small piece"
        )
    }

    private fun finishStep(lower: String): String = when {
        lower.containsAny("email", "reply", "message", "respond") -> "Hit send"
        lower.containsAny("call", "phone") -> "Note the outcome and any follow-up"
        lower.containsAny("write", "draft", "report") -> "Send/save it — done beats perfect"
        lower.containsAny("pay", "invoice", "bill") -> "Confirm the payment went through"
        else -> "Mark it done and take a breath — you did it"
    }

    private fun String.containsAny(vararg needles: String): Boolean =
        needles.any { this.contains(it) }
}
