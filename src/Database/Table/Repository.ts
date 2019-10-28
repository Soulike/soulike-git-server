import {executeTransaction} from '../Function';
import pool from '../Pool';
import {Repository as RepositoryClass} from '../../Class';

export async function insert(repository: RepositoryClass): Promise<void>
{
    const client = await pool.connect();
    try
    {
        await executeTransaction(client, async client =>
        {
            await client.query(`INSERT INTO repositories("username", "name", "description", "isPublic")
                                VALUES
                                    ($1, $2, $3, $4)`, [repository.username, repository.name, repository.description, repository.isPublic]);
        });
    }
    finally
    {
        client.release();
    }
}

export async function deleteByUsernameAndName(username: RepositoryClass['username'], name: RepositoryClass['name']): Promise<void>
{
    const client = await pool.connect();
    try
    {
        await executeTransaction(client, async client =>
        {
            await client.query(`DELETE
                                FROM repositories
                                WHERE "username" = $1
                                  AND "name" = $2`, [username, name]);
        });
    }
    finally
    {
        client.release();
    }
}

export async function update(repository: RepositoryClass, primaryKey?: Pick<RepositoryClass, 'username' | 'name'>): Promise<void>
{
    const client = await pool.connect();
    try
    {
        await executeTransaction(client, async client =>
        {
            await client.query(`UPDATE repositories
                                SET "username"=$1,
                                    "name"=$2,
                                    "description"=$3,
                                    "isPublic"=$4
                                WHERE "username" = $5
                                  AND "name" = $6`,
                [repository.username, repository.name, repository.description, repository.isPublic,
                    primaryKey ? primaryKey.username : repository.username,
                    primaryKey ? primaryKey.name : repository.name]);
        });
    }
    finally
    {
        client.release();
    }
}

export async function selectByUsernameAndName(username: RepositoryClass['username'], name: RepositoryClass['name']): Promise<RepositoryClass | null>
{
    const {rows, rowCount} = await pool.query(`SELECT *
                                               FROM repositories
                                               WHERE "username" = $1
                                                 AND "name" = $2`, [username, name]);
    if (rowCount === 0)
    {
        return null;
    }
    else
    {
        return RepositoryClass.from(rows[0]);
    }
}

export async function selectByIsPublic(isPublic: RepositoryClass['isPublic'], offset: number = 0, limit: number = Number.MAX_SAFE_INTEGER): Promise<Array<RepositoryClass>>
{
    const {rows} = await pool.query(`SELECT *
                                     FROM "repositories"
                                     WHERE "isPublic" = $1 OFFSET $2
                                     LIMIT $3`, [isPublic, offset, limit]);
    return rows.map(row => RepositoryClass.from(row));
}

export async function selectByIsPublicAndUsername(isPublic: RepositoryClass['isPublic'], username: RepositoryClass['username'], offset: number = 0, limit: number = Number.MAX_SAFE_INTEGER): Promise<Array<RepositoryClass>>
{
    const {rows} = await pool.query(`SELECT *
                                     FROM repositories
                                     WHERE "isPublic" = $1
                                       AND "username" = $2 OFFSET $3
                                     LIMIT $4`, [isPublic, username, offset, limit]);
    return rows.map(row => RepositoryClass.from(row));
}

export async function selectByUsername(username: RepositoryClass['username'], offset: number = 0, limit: number = Number.MAX_SAFE_INTEGER): Promise<Array<RepositoryClass>>
{
    const {rows} = await pool.query(`SELECT *
                                     FROM repositories
                                     WHERE "username" = $1 OFFSET $2
                                     LIMIT $3`, [username, offset, limit]);
    return rows.map(row => RepositoryClass.from(row));
}