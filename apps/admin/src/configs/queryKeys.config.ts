export const QUERY_KEYS = {
    auth: {
        register: 'register',
    },
    groups: {
        list: "groups/list",
        messages: (groupId: string) => ["groups", groupId, "messages"],
    },
    
}