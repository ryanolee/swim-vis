import { SwimRumorBuffer } from './SwimGossipBuffer'


const makeRumor = (subject: number, type: "alive" | "dead"): any => ({
    subject,
    type,
})

describe('SwimRumorBuffer talkAboutNRumors', () => {
    it('returns an empty array when buffer is empty', () => {
        const buffer = new SwimRumorBuffer(5)
        expect(buffer.talkAboutNRumors(3)).toEqual([])
    })

    it('returns the correct number of rumors when buffer has enough', () => {
        const buffer = new SwimRumorBuffer(5)
        buffer.addRumor(makeRumor(1, 'alive'))
        buffer.addRumor(makeRumor(2, 'dead'))
        buffer.addRumor(makeRumor(3, 'alive'))
        buffer.addRumor(makeRumor(4, 'dead'))
        buffer.addRumor(makeRumor(5, 'alive'))

        expect(buffer.talkAboutNRumors(3)).toHaveLength(3)
    })

    it('balances the types of rumors', () => {
        const buffer = new SwimRumorBuffer(20)
        buffer.addRumor(makeRumor(1, 'alive'))
        buffer.addRumor(makeRumor(2, 'alive'))
        buffer.addRumor(makeRumor(3, 'alive'))
        buffer.addRumor(makeRumor(4, 'alive'))
        buffer.addRumor(makeRumor(5, 'dead'))
        buffer.addRumor(makeRumor(6, 'dead'))
        buffer.addRumor(makeRumor(7, 'dead'))
        buffer.addRumor(makeRumor(5, 'alive'))

        const rumors = buffer.talkAboutNRumors(4)
        const aliveCount = rumors.filter(r => r.type === 'alive').length
        const deadCount = rumors.filter(r => r.type === 'dead').length

        expect(aliveCount).toEqual(deadCount)
    })

    it('it should fill with other types', () => {
        const buffer = new SwimRumorBuffer(20)
        buffer.addRumor(makeRumor(1, 'alive'))
        buffer.addRumor(makeRumor(2, 'alive'))
        buffer.addRumor(makeRumor(3, 'alive'))
        buffer.addRumor(makeRumor(5, 'alive'))
        buffer.addRumor(makeRumor(6, 'alive'))
        buffer.addRumor(makeRumor(100, 'dead'))


        const rumors = buffer.talkAboutNRumors(4)
        const subjects = rumors.map(r => r.subject)

        expect(subjects).toContain(100)
    })

    it('should return newer rumors first', () => {
        const buffer = new SwimRumorBuffer(20)
        buffer.addRumor(makeRumor(1, 'alive'))
        buffer.addRumor(makeRumor(2, 'alive'))
        buffer.addRumor(makeRumor(3, 'alive'))
        buffer.addRumor(makeRumor(4, 'alive'))
        

        buffer.talkAboutNRumors(4)

        buffer.addRumor(makeRumor(5, 'alive'))
        buffer.addRumor(makeRumor(6, 'alive'))
        buffer.addRumor(makeRumor(7, 'alive'))

        const rumors = buffer.talkAboutNRumors(3)

        const subjects = rumors.map(r => r.subject)

        expect(subjects).toContain(5)
        expect(subjects).toContain(6)
        expect(subjects).toContain(7)
    })
})