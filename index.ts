import DiscondJS, { Channel, Intents } from 'discord.js'
import dotenv from 'dotenv'

dotenv.config()

const client = new DiscondJS.Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_PRESENCES
    ]
})

const maxNumVotes = 6
const approvedEmoji = '✅'

// -----------------------------------------------------------------------------------------

client.on('ready', () => {
    console.log('the bot is ready!')

    const guild = client.guilds.cache.get(process.env.GUILD_ID ?? "")
    let commands = guild ? guild.commands : client.application?.commands

    commands?.create({
        name: 'ping',
        description: '🏓 missing reviewers'
    })

    commands?.create({
        name: 'autocomplete',
        description: '🏓 missing reviewers'
    })
})

// -----------------------------------------------------------------------------------------

client.on('messageReactionAdd', async (reaction) => {
    if (reaction.emoji.name === approvedEmoji &&
        reaction.message.author &&
        Number(reaction.count) >= maxNumVotes) {
        const authorID = reaction.message.author?.id
        const approvedMessage = 'Approved! 🎉✅'
        const message = '<@' + authorID + '>' + ' ' + approvedMessage
        const threadMessages = await reaction.message.thread?.messages.fetch()
        if (threadMessages)
        {
            let botMessage = threadMessages.find(message => message.author.bot == true && message.content.includes(approvedMessage) )
            if (botMessage) return
        }
        sendApprovedMessage(message, authorID, reaction)
    }
})

function sendApprovedMessage(messageContent: string, authorID: string, reactionObject: any) {
    if (reactionObject.message.hasThread) {
        reactionObject.message.thread?.send({
            content: messageContent,
            allowedMentions: { users: [authorID] }
        })
    }
    else {
        reactionObject.message.reply({
            content: messageContent,
            allowedMentions: { users: [authorID] }
        })
    }
}

// -----------------------------------------------------------------------------------------

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return

    if (interaction.commandName === 'ping') {

        if (interaction.channel?.isThread()) {
            const msg = await interaction.channel.fetchStarterMessage()

            var members: string[] = new Array()
            msg.mentions.roles.forEach(element => {
                var userIds = element.members.filter(member => (member.user.bot == false) && (msg.author.id != member.user.id)).map(mapMember => mapMember.user.id)
                members = members.concat(userIds)
            })

            const mentionMembers = new Set(members)
            const reaction = msg.reactions.cache.get(approvedEmoji)
            if (mentionMembers.size > 0) {
                if (reaction) {
                    const reactionUserArray = await reaction.users.fetch()
                    const reactionUser = new Set(reactionUserArray.map(mapMember => mapMember.id))
                    const membersMissingReview = [...mentionMembers].filter(user => !reactionUser.has(user))

                    if (membersMissingReview.length > 0) {

                        const pingMembers = membersMissingReview.join('><@')
                        await interaction.reply({ content: '<@' + pingMembers + '>' + ' 🏓' })
                    }
                    else {
                        await interaction.reply({ content: 'Everyone has reviewed the code, yupiii!!! 🎉', ephemeral: true })
                    }
                }
                else {
                    const pingMembers = [...mentionMembers].join('><@')
                    await interaction.reply({ content: '<@' + pingMembers + '>' + ' 🏓' })
                }
            } else {
                await interaction.reply({ content: 'The review message doesnt have reviewers', ephemeral: true })
            }

        }
        else {
            await interaction.reply({ content: 'Unable to ping the reviewers, the chat is not a thread!, 💀', ephemeral: true })
        }
    }
})

// -----------------------------------------------------------------------------------------

client.login(process.env.TOKEN)