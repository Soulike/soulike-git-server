import {executeTransaction, generateParameterizedStatementAndParametersArray} from '../Function';
import pool from '../Pool';
import {Profile as ProfileClass} from '../../Class';

export async function update(profile: Readonly<Partial<ProfileClass>>, primaryKey: Readonly<Pick<ProfileClass, 'username'>>): Promise<void>
{
    const client = await pool.connect();
    try
    {
        const {parameterizedStatement, parameters} = generateParameterizedStatementAndParametersArray(profile, ',');
        await executeTransaction(client, async client =>
        {
            await client.query(
                    `UPDATE profiles
                     SET ${parameterizedStatement}
                     WHERE "username" = $${parameters.length + 1}`,
                [...parameters, primaryKey.username]);
        });
    }
    finally
    {
        client.release();
    }
}

export async function selectByUsername(username: ProfileClass['username']): Promise<ProfileClass | null>
{
    const {rows, rowCount} = await pool.query(
            `SELECT *
             FROM profiles
             WHERE "username" = $1`,
        [username]);
    if (rowCount === 0)
    {
        return null;
    }
    else
    {
        return ProfileClass.from(rows[0]);
    }
}