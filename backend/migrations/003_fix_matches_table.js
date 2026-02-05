exports.up = async function(knex) {
    // Check if columns exist and add them if they don't
    const hasMatchType = await knex.schema.hasColumn('matches', 'match_type');
    const hasStatus = await knex.schema.hasColumn('matches', 'status');
    const hasCreatedAt = await knex.schema.hasColumn('matches', 'created_at');
    const hasUpdatedAt = await knex.schema.hasColumn('matches', 'updated_at');
    const hasEndedAt = await knex.schema.hasColumn('matches', 'ended_at');
    const hasFinishedAt = await knex.schema.hasColumn('matches', 'finished_at');
    const hasScoreP1 = await knex.schema.hasColumn('matches', 'score_p1');
    const hasScoreP2 = await knex.schema.hasColumn('matches', 'score_p2');
    const hasPlayer1Score = await knex.schema.hasColumn('matches', 'player1_score');
    const hasPlayer2Score = await knex.schema.hasColumn('matches', 'player2_score');

    await knex.schema.alterTable('matches', function(table) {
        if (!hasMatchType) {
            table.string('match_type').defaultTo('classic');
        }
        if (!hasStatus) {
            table.enum('status', ['pending', 'in_progress', 'completed', 'cancelled']).defaultTo('pending');
        }
        if (!hasCreatedAt) {
            table.timestamp('created_at').defaultTo(knex.fn.now());
        }
        if (!hasUpdatedAt) {
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        }
        if (!hasEndedAt) {
            table.timestamp('ended_at').nullable();
        }
    });

    // Handle score column renames only if needed
    if (hasScoreP1 && !hasPlayer1Score) {
        await knex.schema.alterTable('matches', function(table) {
            table.renameColumn('score_p1', 'player1_score');
        });
    }
    if (hasScoreP2 && !hasPlayer2Score) {
        await knex.schema.alterTable('matches', function(table) {
            table.renameColumn('score_p2', 'player2_score');
        });
    }

    // Handle finished_at to ended_at rename only if both conditions are met
    if (hasFinishedAt && !hasEndedAt) {
        await knex.schema.alterTable('matches', function(table) {
            table.renameColumn('finished_at', 'ended_at');
        });
    } else if (hasFinishedAt && hasEndedAt) {
        // If both exist, drop the old one
        await knex.schema.alterTable('matches', function(table) {
            table.dropColumn('finished_at');
        });
    }
};

exports.down = async function(knex) {
    const hasMatchType = await knex.schema.hasColumn('matches', 'match_type');
    const hasStatus = await knex.schema.hasColumn('matches', 'status');
    const hasCreatedAt = await knex.schema.hasColumn('matches', 'created_at');
    const hasUpdatedAt = await knex.schema.hasColumn('matches', 'updated_at');
    const hasEndedAt = await knex.schema.hasColumn('matches', 'ended_at');

    await knex.schema.alterTable('matches', function(table) {
        if (hasMatchType) table.dropColumn('match_type');
        if (hasStatus) table.dropColumn('status');
        if (hasCreatedAt) table.dropColumn('created_at');
        if (hasUpdatedAt) table.dropColumn('updated_at');
        if (hasEndedAt) table.dropColumn('ended_at');
    });
};
