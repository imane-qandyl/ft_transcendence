const db = require('../db');
const CustomError = require('../errors');

class Match {
    constructor(dbInstance) {
        this.db = dbInstance || db;
    }

    async createMatch({
        player1_id,
        player2_id,
        player1_name,
        player2_name,
        match_type,
        tournament_id,
    }) {
        // Input validation
        if (!player1_id || !player2_id || !player1_name || !player2_name || !match_type) {
            throw new CustomError.BadRequestError(
                "player1_id, player2_id, player1_name, player2_name, and match_type are required"
            );
        }

        if (player1_id === player2_id) {
            throw new CustomError.BadRequestError("A player cannot play against themselves");
        }

        const validMatchTypes = ["1v1", "multiplayer", "tournament"];
        if (!validMatchTypes.includes(match_type)) {
            throw new CustomError.BadRequestError(
                `Invalid match_type. Must be one of: ${validMatchTypes.join(", ")}`
            );
        }

        try {
            const [match] = await this.db("matches")
                .insert({
                    player1_id,
                    player2_id,
                    player1_name,
                    player2_name,
                    match_type,
                    tournament_id,
                    status: "pending",
                    created_at: new Date(),
                    updated_at: new Date(),
                })
                .returning("*");

            return match;
        } catch (error) {
            throw new Error(`Failed to create match: ${error.message}`);
        }
    }

    async finalizeMatch(matchId, player1_score, player2_score, currentUserId, extraData = {}) {
        // Input validation
        if (!matchId || player1_score === undefined || player2_score === undefined || !currentUserId) {
            throw new CustomError.BadRequestError(
                "matchId, player1_score, player2_score, and currentUserId are required"
            );
        }

        if (player1_score < 0 || player2_score < 0) {
            throw new CustomError.BadRequestError("Scores cannot be negative");
        }

        const match = await this.db("matches").where({ id: matchId }).first();
        if (!match) {
            throw new CustomError.NotFoundError(`No match with id ${matchId}`);
        }

        if (match.match_type === "multiplayer") {
            throw new CustomError.BadRequestError(
                "Multiplayer matches should be finalized through the match endpoint with is_multiplayer=true"
            );
        }

        if (
            match.player1_id !== currentUserId &&
            match.player2_id !== currentUserId
        ) {
            throw new CustomError.UnauthorizedError(
                "You are not authorized to patch this match's results"
            );
        }

        if (match.status === "finished") {
            throw new CustomError.BadRequestError(
                "Match has already been finalized"
            );
        }

        // Determine winner
        let winner_id = null;
        if (player1_score > player2_score) {
            winner_id = match.player1_id;
        } else if (player2_score > player1_score) {
            winner_id = match.player2_id;
        }

        try {
            const [updatedMatch] = await this.db("matches")
                .where({ id: matchId })
                .update({
                    player1_score,
                    player2_score,
                    winner_id,
                    status: "completed",
                    ended_at: new Date(),
                    updated_at: new Date(),
                    ...extraData,
                })
                .returning("*");

            return updatedMatch;
        } catch (error) {
            throw new Error(`Failed to finalize match: ${error.message}`);
        }
    }

    async updateMatchScore(matchId, scoreP1, scoreP2, winnerId = null) {
        await this.db("matches")
            .where({ id: matchId })
            .update({
                score_p1: scoreP1,
                score_p2: scoreP2,
                winner_id: winnerId,
                finished_at: winnerId ? new Date() : null
            });
    }

    async getMatchHistory(userId) {
        return await this.db("matches")
            .where("player1_id", userId)
            .orWhere("player2_id", userId)
            .orderBy("started_at", "desc");
    }

    async listUserNonMultiplayerMatches(userId, limit = 10, page = 1, match_type) {
        // Input validation
        if (!userId) {
            throw new CustomError.BadRequestError("userId is required");
        }

        if (limit <= 0 || page <= 0) {
            throw new CustomError.BadRequestError("limit and page must be positive numbers");
        }

        const query = this.db("matches").where(function () {
            this.where("player1_id", userId).orWhere("player2_id", userId);
        });

        query.andWhereNot("match_type", "multiplayer");

        if (match_type && match_type !== "multiplayer") {
            const validTypes = ["1v1", "tournament"];
            if (!validTypes.includes(match_type)) {
                throw new CustomError.BadRequestError(
                    `Invalid match_type. Must be one of: ${validTypes.join(", ")}`
                );
            }
            query.andWhere("match_type", match_type);
        }

        const matches = await query
            .orderBy("created_at", "desc")
            .limit(limit)
            .offset((page - 1) * limit);

        return matches;
    }

    async getTournamentMatches(tournamentId) {
        if (!tournamentId) {
            throw new CustomError.BadRequestError("tournamentId is required");
        }

        const matches = await this.db("matches")
            .where({ tournament_id: tournamentId })
            .orderBy("created_at", "asc");

        return matches;
    }

    async listUserMultiplayerMatches(userId, limit = 10, page = 1) {
        // Input validation
        if (!userId) {
            throw new CustomError.BadRequestError("userId is required");
        }

        if (limit <= 0 || page <= 0) {
            throw new CustomError.BadRequestError("limit and page must be positive numbers");
        }

        const multiplayerMatches = await this.db("matches")
            .select(
                "id",
                "status",
                "match_type",
                "tournament_id",
                "player1_score",
                "player2_score",
                "winner_id",
                "created_at",
                "updated_at"
            )
            .where(function () {
                this.where("player1_id", userId).orWhere("player2_id", userId);
            })
            .andWhere({ match_type: "multiplayer" })
            .orderBy("created_at", "desc")
            .limit(limit)
            .offset((page - 1) * limit);

        return multiplayerMatches;
    }

    // Additional helpful methods
    async updateMatchStatus(matchId, status) {
        if (!matchId || !status) {
            throw new CustomError.BadRequestError("matchId and status are required");
        }

        const validStatuses = ["pending", "in_progress", "finished", "cancelled"];
        if (!validStatuses.includes(status)) {
            throw new CustomError.BadRequestError(
                `Invalid status. Must be one of: ${validStatuses.join(", ")}`
            );
        }

        const match = await this.db("matches").where({ id: matchId }).first();
        if (!match) {
            throw new CustomError.NotFoundError(`No match with id ${matchId}`);
        }

        const [updatedMatch] = await this.db("matches")
            .where({ id: matchId })
            .update({
                status,
                updated_at: this.db.fn.now(),
            })
            .returning("*");

        return updatedMatch;
    }

    async getMatchStats(userId) {
        if (!userId) {
            throw new CustomError.BadRequestError("userId is required");
        }

        const stats = await this.db("matches")
            .select(
                this.db.raw("COUNT(*) as total_matches"),
                this.db.raw("COUNT(CASE WHEN winner_id = ? THEN 1 END) as wins", [userId]),
                this.db.raw("COUNT(CASE WHEN winner_id != ? AND winner_id IS NOT NULL THEN 1 END) as losses", [userId]),
                this.db.raw("COUNT(CASE WHEN winner_id IS NULL AND status = 'finished' THEN 1 END) as draws")
            )
            .where(function () {
                this.where("player1_id", userId).orWhere("player2_id", userId);
            })
            .andWhere("status", "finished")
            .first();

        return {
            total_matches: parseInt(stats.total_matches),
            wins: parseInt(stats.wins),
            losses: parseInt(stats.losses),
            draws: parseInt(stats.draws),
        };
    }
}

module.exports = Match;
