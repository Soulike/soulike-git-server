import {Account, Group, Repository, ResponseBody, ServiceResponse} from '../Class';
import {Account as AccountTable, Group as GroupTable, Repository as RepositoryTable} from '../Database';
import {Session} from 'koa-session';
import {InvalidSessionError} from '../Dispatcher/Class';

export async function add(group: Omit<Group, 'id'>, session: Session | null): Promise<ServiceResponse<void>>
{
    if (session === null)
    {
        throw new InvalidSessionError();
    }
    const {username} = session;
    if (typeof username !== 'string')
    {
        throw new InvalidSessionError();
    }
    const groupWithTheSameUsernameAndName = await AccountTable.getGroupByUsernameAndGroupName(username, group.name);
    if (groupWithTheSameUsernameAndName !== null)
    {
        return new ServiceResponse<void>(403, {},
            new ResponseBody<void>(false, '小组名已存在'));
    }

    let groupId = 0;
    try
    {
        groupId = await GroupTable.insertAndReturnId(group);
        await GroupTable.addAccounts(groupId, [username]);
        await GroupTable.addAdmins(groupId, [username]);
    }
    catch (e)
    {
        await GroupTable.deleteById(groupId);
        throw e;
    }
    return new ServiceResponse<void>(200, {},
        new ResponseBody<void>(true));
}

export async function dismiss(group: Pick<Group, 'id'>): Promise<ServiceResponse<void>>
{
    await GroupTable.deleteById(group.id);
    return new ServiceResponse<void>(200, {},
        new ResponseBody<void>(true));
}

export async function info(group: Pick<Group, 'id'>): Promise<ServiceResponse<Group | void>>
{
    const {id: groupId} = group;
    const groupInDatabase = await GroupTable.selectById(groupId);
    if (groupInDatabase === null)
    {
        return new ServiceResponse<void>(404, {},
            new ResponseBody<void>(false, '小组不存在'));
    }
    return new ServiceResponse<Group>(200, {},
        new ResponseBody<Group>(true, '', groupInDatabase));
}

export async function accounts(group: Pick<Group, 'id'>): Promise<ServiceResponse<Account[] | void>>
{
    const {id: groupId} = group;
    if (!(await groupExists(group)))
    {
        return new ServiceResponse<void>(404, {},
            new ResponseBody<void>(false, '小组不存在'));
    }
    const accounts = await GroupTable.getAccountsById(groupId);
    return new ServiceResponse<Account[]>(200, {},
        new ResponseBody<Account[]>(true, '', accounts));
}

export async function addAccounts(group: Pick<Group, 'id'>, usernames: string[], session: Session | null): Promise<ServiceResponse<void>>
{
    if (!(await isAbleToUpdateGroup(group, session)))
    {
        return new ServiceResponse<void>(403, {},
            new ResponseBody<void>(false, '添加失败：您不是小组的管理员'));
    }
    const {id: groupId} = group;
    if (!(await groupExists(group)))
    {
        return new ServiceResponse<void>(404, {},
            new ResponseBody<void>(false, '小组不存在'));
    }
    for (const username of usernames)
    {
        if (await AccountTable.selectByUsername(username) === null)
        {
            return new ServiceResponse<void>(403, {},
                new ResponseBody<void>(false, `用户${username}不存在`));
        }
    }
    await GroupTable.addAccounts(groupId, usernames);
    return new ServiceResponse<void>(200, {},
        new ResponseBody<void>(true));
}

export async function removeAccounts(group: Pick<Group, 'id'>, usernames: string[], session: Session | null): Promise<ServiceResponse<void>>
{
    if (!(await isAbleToUpdateGroup(group, session)))
    {
        return new ServiceResponse<void>(403, {},
            new ResponseBody<void>(false, '删除失败：您不是小组的管理员'));
    }
    const {id: groupId} = group;
    if (!(await groupExists(group)))
    {
        return new ServiceResponse<void>(404, {},
            new ResponseBody<void>(false, '小组不存在'));
    }
    await GroupTable.removeAccounts(groupId, usernames);
    return new ServiceResponse<void>(200, {},
        new ResponseBody<void>(true));
}

export async function admins(group: Pick<Group, 'id'>): Promise<ServiceResponse<Account[] | void>>
{
    const {id: groupId} = group;
    if (!(await groupExists(group)))
    {
        return new ServiceResponse<void>(404, {},
            new ResponseBody<void>(false, '小组不存在'));
    }
    const accounts = await GroupTable.getAdminsById(groupId);
    return new ServiceResponse<Account[]>(200, {},
        new ResponseBody<Account[]>(true, '', accounts));
}

export async function addAdmins(group: Pick<Group, 'id'>, usernames: string[], session: Session | null): Promise<ServiceResponse<void>>
{
    if (!(await isAbleToUpdateGroup(group, session)))
    {
        return new ServiceResponse<void>(403, {},
            new ResponseBody<void>(false, '添加失败：您不是小组的管理员'));
    }
    const {id: groupId} = group;
    if (!(await groupExists(group)))
    {
        return new ServiceResponse<void>(404, {},
            new ResponseBody<void>(false, '小组不存在'));
    }
    for (const username of usernames)
    {
        if (await AccountTable.selectByUsername(username) === null)
        {
            return new ServiceResponse<void>(403, {},
                new ResponseBody<void>(false, `用户${username}不存在`));
        }
        if (!(await isGroupMember(group, username)))
        {
            return new ServiceResponse<void>(403, {},
                new ResponseBody<void>(false, `用户${username}不是小组成员`));
        }
    }
    await GroupTable.addAdmins(groupId, usernames);
    return new ServiceResponse<void>(200, {},
        new ResponseBody<void>(true));
}

export async function removeAdmins(group: Pick<Group, 'id'>, usernames: string[], session: Session | null): Promise<ServiceResponse<void>>
{
    if (!(await isAbleToUpdateGroup(group, session)))
    {
        return new ServiceResponse<void>(403, {},
            new ResponseBody<void>(false, '删除失败：您不是小组的管理员'));
    }
    const {id: groupId} = group;
    if (!(await groupExists(group)))
    {
        return new ServiceResponse<void>(404, {},
            new ResponseBody<void>(false, '小组不存在'));
    }
    await GroupTable.removeAdmins(groupId, usernames);
    return new ServiceResponse<void>(200, {},
        new ResponseBody<void>(true));
}

export async function repositories(group: Pick<Group, 'id'>): Promise<ServiceResponse<Repository[] | void>>
{
    const {id: groupId} = group;
    const groupInDatabase = await GroupTable.selectById(groupId);
    if (groupInDatabase === null)
    {
        return new ServiceResponse<Repository[]>(404, {},
            new ResponseBody<Repository[]>(false, '小组不存在'));
    }
    const repositories = await GroupTable.getRepositoriesById(groupId);
    return new ServiceResponse<Repository[]>(200, {},
        new ResponseBody<Repository[]>(true, '', repositories));
}

export async function removeRepositories(group: Pick<Group, 'id'>, repositories: Pick<Repository, 'username' | 'name'>[], session: Session | null): Promise<ServiceResponse<void>>
{
    if (!(await groupExists(group)))
    {
        return new ServiceResponse<void>(404, {},
            new ResponseBody<void>(false, '小组不存在'));
    }
    if (!(await isAbleToUpdateGroup(group, session)))
    {
        return new ServiceResponse<void>(403, {},
            new ResponseBody<void>(false, '删除失败：您不是小组的管理员'));
    }
    for (const {username, name} of repositories)
    {
        if (await RepositoryTable.selectByUsernameAndName(username, name) === null)
        {
            return new ServiceResponse<void>(404, {},
                new ResponseBody<void>(false, `仓库${name}不存在`));
        }
    }
    await GroupTable.removeRepositories(group.id, repositories);
    return new ServiceResponse<void>(200, {},
        new ResponseBody<void>(true, ''));
}

async function isAbleToUpdateGroup(group: Pick<Group, 'id'>, session: Session | null): Promise<boolean>
{
    if (session === null)
    {
        return false;
    }
    const {username} = session;
    const {id: groupId} = group;
    const adminsInGroup = await GroupTable.getAdminsById(groupId);
    return adminsInGroup.map(({username}) => username).includes(username);
}

async function isGroupMember(group: Pick<Group, 'id'>, username: string): Promise<boolean>
{
    const accountsInGroup = await GroupTable.getAccountsById(group.id);
    return accountsInGroup.map(({username}) => username).includes(username);
}

async function groupExists(group: Pick<Group, 'id'>): Promise<boolean>
{
    const {id} = group;
    const groupInDatabase = await GroupTable.selectById(id);
    return groupInDatabase !== null;
}