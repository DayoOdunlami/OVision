// ═══════════════════════════════════════════════════════════════════
// prayers.js — the content of the prayer surface.
//
// Moved verbatim from the original single-file app (now served at
// /pray/classic/). Each prayer renders in three registers:
//
//   flowing.{solo,family,kids}(ctx)  continuous prose
//   sections[].spoken(ctx)           modern English, one thought each
//   sections[].explain(ctx)          the Greek/Hebrew note
//
// `ctx` comes from buildPrayerContext() in ../lib/context.js and carries
// the two names plus pronouns already inflected for "them" vs "us".
//
// These functions return small HTML strings (name highlights, <em>) and
// are rendered with dangerouslySetInnerHTML. That's safe here: every
// string is authored in this file; nothing user-supplied flows in.
// ═══════════════════════════════════════════════════════════════════

export const prayers = [
  {
    ref: 'Ephesians 1:17\u201319',
    theme: 'Spiritual perception',
    flowing: {
      solo: (c) => `Father, I bring ${c.pair} before you this morning.\n\nI keep asking that you, the God of our Lord Jesus Christ, the glorious Father, would give ${c.themP} the Spirit of wisdom and revelation, so that ${c.theyP} may know you better.\n\nI pray that the eyes of ${c.theirP} hearts may be enlightened, in order that ${c.theyP} may know the hope to which you have called ${c.themP}, the riches of your glorious inheritance in your holy people, and your incomparably great power for ${c.pair} who believe.`,
      family: (c) => `Father, we bring ${c.pair} before you this morning.\n\nWe keep asking that you, the God of our Lord Jesus Christ, the glorious Father, would give ${c.themP} the Spirit of wisdom and revelation, so that ${c.theyP} may know you better.\n\nWe pray that the eyes of ${c.theirP} hearts may be enlightened, in order that ${c.theyP} may know the hope to which you have called ${c.themP}, the riches of your glorious inheritance in your holy people, and your incomparably great power for ${c.pair} who believe.`,
      kids: (c) => `God, please help ${c.pair} to know you better.\n\nPlease open the eyes of ${c.theirP} hearts, so ${c.theyP} can see how much you love ${c.themP}.\n\nHelp ${c.themP} to know the hope you've given ${c.themP}, the amazing things you have for ${c.themP}, and how strong and powerful you are.`
    },
    sections: [
      {
        spoken:  (c) => `God of our Lord Jesus, glorious Father \u2014 give ${c.pair} the kind of Spirit who pulls back the curtain. Not more facts about you. A real, dawning recognition of who you are.`,
        explain: (c) => `'Wisdom and revelation' \u2014 in Greek, <em>sophia</em> and <em>apokalypsis</em>. The first is sustained insight; the second is when a curtain pulls back and you suddenly see what was always there. You're asking for both \u2014 not just clever thinking, but moments when truth lands. And it's the Spirit who does this; it's not something ${c.they} can engineer for ${c.themselves}.`
      },
      {
        spoken:  (c) => `Switch the lights on inside ${c.them}. The eyes underneath ${c.their} eyes \u2014 the part of ${c.them} that sees what's actually true \u2014 let those see.`,
        explain: (c) => `In Greek, the 'eyes' here aren't physical \u2014 they're the perceiving faculty of the inner person. Hebrew thought located understanding in the heart, not the head. So you're asking God to switch on the light inside the part of ${c.them} that perceives reality \u2014 what's actually going on spiritually, beyond what's visible.`
      },
      {
        spoken:  (c) => `So ${c.they} can grasp three things: the hope you've called ${c.them} into. The inheritance you've already stored up for ${c.them} among your people. And the sheer scale of the power already at work in ${c.them} because ${c.they} believe \u2014 the same power that raised Jesus.`,
        explain: (c) => `Three things to know: <em>hope</em> (what ${c.they} are moving toward), <em>inheritance</em> (what's already ${c.selfIncluded ? 'ours' : 'theirs'} in God's people, though not yet handled), and <em>power</em> (what's already at work in ${c.them}). Paul links this power to the resurrection \u2014 the same energy that pulled Jesus out of the grave is what's animating this life of faith. You're asking that ${c.they} would be conscious of this, not just told about it.`
      }
    ]
  },
  {
    ref: 'Ephesians 3:16\u201319',
    theme: 'Inner strength & the love of Christ',
    flowing: {
      solo: (c) => `Father, I pray that out of your glorious riches you may strengthen ${c.pair} with power through your Spirit in ${c.theirP} inner being, so that Christ may dwell in ${c.theirP} hearts through faith.\n\nAnd I pray that ${c.pairSubj}, being rooted and established in love, may have power, together with all the Lord's holy people, to grasp how wide and long and high and deep is the love of Christ, and to know this love that surpasses knowledge \u2014 that ${c.theyP} may be filled to the measure of all the fullness of God.`,
      family: (c) => `Father, we pray that out of your glorious riches you may strengthen ${c.pair} with power through your Spirit in ${c.theirP} inner being, so that Christ may dwell in ${c.theirP} hearts through faith.\n\nAnd we pray that ${c.pairSubj}, being rooted and established in love, may have power, together with all the Lord's holy people, to grasp how wide and long and high and deep is the love of Christ, and to know this love that surpasses knowledge \u2014 that ${c.theyP} may be filled to the measure of all the fullness of God.`,
      kids: (c) => `God, please make ${c.pair} strong on the inside by your Spirit.\n\nHelp Jesus to live deep in ${c.theirP} hearts.\n\nHelp ${c.themP} to know how wide and long and high and deep your love is \u2014 even though it's so big we can never fully understand it.`
    },
    sections: [
      {
        spoken:  (c) => `God, from the deepest part of who you are, fortify the deepest part of who ${c.pairSubj} are. Do the work in ${c.them} that ${c.selfIncluded ? "we can't do ourselves" : "I can't do"}.`,
        explain: (c) => `Two different Greek words for strength here. You're not asking for ${c.them} to feel a bit more confident. You're asking for structural reinforcement of who ${c.they} are \u2014 in the part of ${c.them} that no teacher, friend, or even parent can reach. You're acknowledging that there's a dimension of ${c.them} that belongs to God alone, and asking him to be active there.`
      },
      {
        spoken:  (c) => `Let Christ make himself so at home in ${c.their} hearts through trust that ${c.they} can't imagine life without him there.`,
        explain: (c) => `The Greek word for 'dwell' is <em>katoike\u014d</em> \u2014 to settle in, not just visit. It's the difference between a guest room and a primary residence. You're asking that Christ wouldn't just visit ${c.their} lives but actually live there \u2014 and that trust would be the door he comes through.`
      },
      {
        spoken:  (c) => `Let your love be so foundational in ${c.their} lives that everything else grows from it and stands on it.`,
        explain: (c) => `Paul stacks two metaphors: roots (a tree \u2014 organic, growing) and foundation (a building \u2014 structural, fixed). Both point to love as the thing everything else in ${c.their} life depends on. You're asking that love wouldn't be a feeling ${c.they} sometimes have, but the soil ${c.they} grow in and the ground ${c.they} stand on.`
      },
      {
        spoken:  (c) => `Expand ${c.their} capacity to understand how much ${c.they} are loved \u2014 how wide and long and high and deep your love is \u2014 even though it's too big to fully comprehend.`,
        explain: (c) => `Four dimensions \u2014 Paul piles them up to insist this is bigger than language. The verb 'grasp' (<em>katalamban\u014d</em>) is forceful: to seize, to fully take hold. Then the paradox: 'know this love that surpasses knowledge.' You're asking that ${c.they} would have a real experiential grip on something that, by definition, can never be fully comprehended.`
      },
      {
        spoken:  (c) => `God, hold nothing back. Fill ${c.them} with everything you are.`,
        explain: (c) => `One of the most audacious requests in the New Testament. Not 'filled with a bit of God' \u2014 <em>the fullness of God</em>. Paul thinks human beings, by the Spirit, can carry the actual fullness of who God is. You're asking for the maximum, not the minimum.`
      }
    ]
  },
  {
    ref: 'Philippians 1:9\u201311',
    theme: 'Love abounding in discernment',
    flowing: {
      solo: (c) => `Father, this is my prayer: that ${c.pairPossessive} love may abound more and more in knowledge and depth of insight, so that ${c.theyP} may be able to discern what is best and may be pure and blameless for the day of Christ, filled with the fruit of righteousness that comes through Jesus Christ \u2014 to the glory and praise of God.`,
      family: (c) => `Father, this is our prayer: that ${c.pairPossessive} love may abound more and more in knowledge and depth of insight, so that ${c.theyP} may be able to discern what is best and may be pure and blameless for the day of Christ, filled with the fruit of righteousness that comes through Jesus Christ \u2014 to the glory and praise of God.`,
      kids: (c) => `God, please help ${c.pairPossessive} love to grow bigger and wiser.\n\nHelp ${c.themP} to know what's right and to choose what's best.\n\nHelp ${c.themP} to live a good and beautiful life that makes you happy.`
    },
    sections: [
      {
        spoken:  (c) => `God \u2014 let ${c.pairPossessive} love grow up. Not just feel more, but understand more. Real love that comes with insight, not just emotion.`,
        explain: (c) => `'Love' here is <em>agap\u0113</em> \u2014 committed, willed love. Paul's prayer is that it would <em>abound</em> \u2014 overflow, exceed \u2014 but specifically in <em>epign\u014dsis</em> (deep knowledge) and <em>aisth\u0113sis</em> (moral perception). You're praying against sentimental love. You want ${c.their} love to grow up \u2014 to be smart, perceptive, informed, not just warm.`
      },
      {
        spoken:  (c) => `Let it sharpen ${c.their} judgement \u2014 so ${c.they} can tell what actually matters from what just looks important. Keep ${c.them} honest and undivided as ${c.they} walk toward the day ${c.they} meet Christ.`,
        explain: (c) => `The verb <em>dokimaz\u014d</em> means to test and approve \u2014 like assessing precious metal. You're asking that ${c.they} would be able to tell what's truly good from what just looks good, and live cleanly toward the day ${c.they} stand before Christ. Not perfection now \u2014 orientation now.`
      },
      {
        spoken:  (c) => `Fill ${c.their} lives with the kind of fruit that only comes from him \u2014 beautiful, real, undeniable \u2014 so that everyone who sees it ends up praising you.`,
        explain: (c) => `Fruit you can't fake \u2014 it grows naturally from a life properly rooted. And the endpoint of the prayer is praise: ${c.their} flourishing is for God's reputation in the world. You're asking that ${c.their} good lives wouldn't end at ${c.them} but point past ${c.them} to God.`
      }
    ]
  },
  {
    ref: 'Colossians 1:9\u201312',
    theme: "Knowledge of God's will & fruitful living",
    flowing: {
      solo: (c) => c.selfIncluded
        ? `Father, I have not stopped praying for ${c.pair}. I continually ask you to fill ${c.themP} with the knowledge of your will through all the wisdom and understanding that the Spirit gives, so that ${c.theyP} may live a life worthy of the Lord and please you in every way: bearing fruit in every good work, growing in the knowledge of God, being strengthened with all power according to your glorious might so that ${c.theyP} may have great endurance and patience, and giving joyful thanks to the Father, who has qualified ${c.pair} to share in the inheritance of your holy people in the kingdom of light.`
        : `Father, since the day I heard about ${c.pair}, I have not stopped praying for ${c.themP}. I continually ask you to fill ${c.themP} with the knowledge of your will through all the wisdom and understanding that the Spirit gives, so that ${c.theyP} may live a life worthy of the Lord and please you in every way: bearing fruit in every good work, growing in the knowledge of God, being strengthened with all power according to your glorious might so that ${c.theyP} may have great endurance and patience, and giving joyful thanks to the Father, who has qualified ${c.pair} to share in the inheritance of your holy people in the kingdom of light.`,
      family: (c) => `Father, we have not stopped praying for ${c.pair}. We continually ask you to fill ${c.themP} with the knowledge of your will through all the wisdom and understanding that the Spirit gives, so that ${c.theyP} may live a life worthy of the Lord and please you in every way: bearing fruit in every good work, growing in the knowledge of God, being strengthened with all power according to your glorious might so that ${c.theyP} may have great endurance and patience, and giving joyful thanks to the Father, who has qualified ${c.pair} to share in the inheritance of your holy people in the kingdom of light.`,
      kids: (c) => `God, please help ${c.pair} to know what you want.\n\nGive ${c.themP} wisdom and understanding.\n\nHelp ${c.themP} to live in a way that pleases you, to do good things, and to know you better and better.`
    },
    sections: [
      {
        spoken:  (c) => `God, I'm not going to stop asking for this: fill ${c.pair} with a clear knowledge of what you want. Not vague spirituality \u2014 real wisdom and understanding, the kind your Spirit gives.`,
        explain: (c) => `'Knowledge of his will' \u2014 <em>epign\u014dsis tou thel\u0113matos autou</em>. Not abstract spiritual knowledge but practical alignment: what God wants here, in this situation. Paired with 'spiritual wisdom and understanding' \u2014 the Spirit-given capacity to apply truth to life. You're asking for clarity, not just data.`
      },
      {
        spoken:  (c) => `So that ${c.their} lives actually fit what you've called ${c.them} to. Pleasing you \u2014 not as performance, but as the natural shape ${c.their} days take.`,
        explain: (c) => `'Worthy' (<em>axi\u014ds</em>) means matching the weight \u2014 like a balance scale tipping evenly. You're asking ${c.their} lives to match the calling. 'Please him in every way' is total \u2014 every domain. Not religious life <em>and</em> the rest. One life, ordered toward him.`
      },
      {
        spoken:  (c) => `Make every good thing ${c.they} do bear fruit. And make ${c.them} grow \u2014 slowly, steadily \u2014 into people who know you more deeply than ${c.they} did yesterday.`,
        explain: (c) => `Two parallel Greek verbs \u2014 <em>karpophore\u014d</em> (bear fruit) and <em>auxan\u014d</em> (grow). Paul wants both: external output (fruit) and internal expansion (knowing God more). You're asking for visible flourishing <em>and</em> hidden depth, neither sacrificed to the other.`
      },
      {
        spoken:  (c) => `Strengthen ${c.them} with the kind of power that comes from your own brightness \u2014 so ${c.they} can hold on, stay patient, keep going when it's hard.`,
        explain: (c) => `Two Greek words: <em>hupomon\u0113</em> (endurance \u2014 staying under the load) and <em>makrothumia</em> (long-tempered, patient with people). You're asking that the power ${c.they} receive wouldn't make ${c.them} invincible \u2014 it would make ${c.them} durable. Able to last.`
      },
      {
        spoken:  (c) => `And let ${c.them} give thanks gladly \u2014 knowing you've already qualified ${c.them}, already pulled ${c.them} into the inheritance, already secured ${c.their} place in the kingdom of light.`,
        explain: (c) => `The verb 'qualified' (<em>hikano\u014d</em>) is in past tense \u2014 already done. The kingdom isn't something to earn entry to; it's something ${c.they} have been transferred into. Thanksgiving here flows from recognising what's already true, not striving to make it true. You're praying ${c.them} into rest.`
      }
    ]
  },
  // ── Added prayers ────────────────────────────────────────────────
  // NOTE ON WORDING: the four prayers above render `flowing` in NIV
  // wording. Everything below is written as an original modern English
  // rendering of the passage rather than a quotation of any published
  // translation, which keeps this file distributable without permission
  // clearances. The `spoken` and `explain` layers were always original.
  // If you'd rather have a specific translation's text, that's a
  // licensing question, not a technical one.
  {
    ref: 'Romans 15:13',
    theme: 'Joy, peace and overflowing hope',
    flowing: {
      solo: (c) => `Father, you are the God of hope.\n\nFill ${c.pair} with joy, and with peace, as ${c.theyP} lean on you.\n\nAnd let hope spill out of ${c.themP} — more than ${c.theyP} could manufacture — carried by the power of your Spirit.`,
      family: (c) => `Father, you are the God of hope.\n\nFill ${c.pair} with joy, and with peace, as ${c.theyP} lean on you.\n\nAnd let hope spill out of ${c.themP} — more than ${c.theyP} could manufacture — carried by the power of your Spirit.`,
      kids: (c) => `God, you are where hope comes from.\n\nPlease fill ${c.pair} up with joy and with peace.\n\nAnd give ${c.themP} so much hope that it spills over.`
    },
    sections: [
      {
        spoken:  (c) => `God — you are where hope comes from. Not optimism. Not a good mood. Hope.`,
        explain: (c) => `Paul's title for God here is <em>ho theos tēs elpidos</em> — the God <em>of</em> hope: its source, not just its object. And Greek <em>elpis</em> isn't wishful thinking; it's settled expectation about something already secured. So you're not asking God to cheer ${c.them} up. You're asking him to be to ${c.them} what he already is.`
      },
      {
        spoken:  (c) => `Fill ${c.them} up — joy and peace — and let it come as ${c.they} trust you, not before.`,
        explain: (c) => `The filling is tied to <em>en tō pisteuein</em> — "in the believing." Joy and peace arrive as a by-product of leaning on God, not as a prize for having leaned well. Which means this prayer is really asking that trusting God would be <em>possible</em> for ${c.them} today, and that the rest would follow from that.`
      },
      {
        spoken:  (c) => `And then let it overflow. More hope than ${c.they} have room for — not ${c.their} own effort, your Spirit doing it.`,
        explain: (c) => `<em>Perisseuō</em> — to overflow, to have more than enough. Paul then names whose work it is: "by the power of the Holy Spirit." You're asking for a surplus, and asking God to supply it — which quietly releases you from having to generate hope on behalf of the people you love.`
      }
    ]
  },
  {
    ref: '1 Thessalonians 3:12–13',
    theme: 'Love spilling past the front door',
    flowing: {
      solo: (c) => `Father, make ${c.pairPossessive} love grow — for each other, and for everyone around ${c.themP} — until it spills over the edges.\n\nSteady ${c.theirP} hearts.\n\nAnd bring ${c.themP} through whole and unashamed before you, all the way to the day Christ comes.`,
      family: (c) => `Father, make ${c.pairPossessive} love grow — for each other, and for everyone around ${c.themP} — until it spills over the edges.\n\nSteady ${c.theirP} hearts.\n\nAnd bring ${c.themP} through whole and unashamed before you, all the way to the day Christ comes.`,
      kids: (c) => `God, please make ${c.pairPossessive} love get bigger and bigger — for each other, and for everybody else too.\n\nPlease make ${c.theirP} hearts strong and steady.\n\nAnd help ${c.themP} to stay close to you right to the end.`
    },
    sections: [
      {
        spoken:  (c) => `God, make ${c.their} love grow — and then keep going. Past what's comfortable. Past the family.`,
        explain: (c) => `Two verbs stacked: <em>pleonazō</em> (increase) and <em>perisseuō</em> (overflow). Paul also names the direction — "for one another <em>and for everyone else</em>." You're praying against a love that stops at the front door: household first, then outward.`
      },
      {
        spoken:  (c) => `Hold ${c.their} hearts steady. Not fragile, not brittle — settled.`,
        explain: (c) => `<em>Stērizō</em> — to prop, to make firm; the word you'd use for setting a post in the ground. And it's the <em>heart</em> being set — in Hebrew thought the centre of will and affection, not feeling. You're asking for people who don't wobble.`
      },
      {
        spoken:  (c) => `And bring ${c.them} through to the end with nothing to be ashamed of. Whole, when ${c.they} see him.`,
        explain: (c) => `"Blameless in holiness" — <em>amōmos</em>, the word for an unblemished offering. Paul's horizon is "at the coming of our Lord Jesus," so this is a prayer with a finish line in view: not flawlessness this morning, but a life that arrives intact.`
      }
    ]
  },
  {
    ref: 'Hebrews 13:20–21',
    theme: 'Equipped for the actual work',
    flowing: {
      solo: (c) => `God of peace — you brought Jesus back up from the dead, the great shepherd of the sheep.\n\nEquip ${c.pair} with everything ${c.theyP} need for what you are actually asking of ${c.themP}.\n\nAnd then work in ${c.themP} whatever pleases you, through Jesus Christ, to whom be glory for ever.`,
      family: (c) => `God of peace — you brought Jesus back up from the dead, the great shepherd of the sheep.\n\nEquip ${c.pair} with everything ${c.theyP} need for what you are actually asking of ${c.themP}.\n\nAnd then work in ${c.themP} whatever pleases you, through Jesus Christ, to whom be glory for ever.`,
      kids: (c) => `God, you brought Jesus back to life. You are the good shepherd who looks after us.\n\nPlease give ${c.pair} everything ${c.theyP} need to do what you've asked ${c.themP} to do.\n\nAnd please do good things inside ${c.themP} that make you happy.`
    },
    sections: [
      {
        spoken:  (c) => `God of peace — the one who brought Jesus up out of the grave, the shepherd who came back.`,
        explain: (c) => `The blessing grounds itself in the resurrection <em>before</em> it asks for anything. <em>Anagō</em> — "led up," the word for bringing something up out of a pit. The logic is deliberate: the God who did <em>that</em> can certainly manage what you're about to ask for ${c.them}.`
      },
      {
        spoken:  (c) => `Kit ${c.them} out. Everything ${c.they} need for what you've actually given ${c.them} to do — not what I imagine for ${c.them}.`,
        explain: (c) => `<em>Katartizō</em> is a craftsman's word: to mend a net, set a broken bone, bring a thing to the condition where it works. You're not asking for more raw talent. You're asking that ${c.they} be made fit for the actual purpose — which is a prayer that requires you to let go of your own version of ${c.their} life.`
      },
      {
        spoken:  (c) => `And then do the work in ${c.them} yourself. Whatever pleases you — you produce it.`,
        explain: (c) => `The turn is in the phrase "working in you." God is both the one who equips and the one who then acts through what he equipped. The writer refuses to leave the doing to us. You're praying for a life where the good that comes out was put in.`
      }
    ]
  },
  {
    ref: 'Psalm 139:23–24',
    theme: 'Search me — honest self-knowledge',
    flowing: {
      solo: (c) => `Search ${c.pair}, God. Know ${c.theirP} hearts.\n\nTest ${c.themP}, and see what ${c.theyP} are anxious about.\n\nShow ${c.themP} anything in ${c.themP} that is doing harm — and lead ${c.themP} along the road that lasts.`,
      family: (c) => `Search ${c.pair}, God. Know ${c.theirP} hearts.\n\nTest ${c.themP}, and see what ${c.theyP} are anxious about.\n\nShow ${c.themP} anything in ${c.themP} that is doing harm — and lead ${c.themP} along the road that lasts.`,
      kids: (c) => `God, you know everything about ${c.pair}.\n\nPlease look inside ${c.themP} and see what ${c.theyP} are worried about.\n\nIf there's anything in ${c.themP} that isn't good for ${c.themP}, please show ${c.themP} — and take ${c.themP} the right way.`
    },
    sections: [
      {
        spoken:  (c) => `Search ${c.them}, God. Go all the way in. Know what's actually there.`,
        explain: (c) => `<em>Chaqar</em> — to dig, to explore; the word for mining, or for a scout surveying ground. David isn't asking God to <em>find out</em> — the whole psalm has already said God knows. He's <em>consenting</em> to be known. Praying it over someone else is asking that ${c.they} would be willing too.`
      },
      {
        spoken:  (c) => `Test ${c.them}. Find the anxious places — the thoughts that keep ${c.them} awake.`,
        explain: (c) => `The Hebrew is <em>sarʿappay</em> — branching, restless inner churn; usually rendered "anxious thoughts." You're asking God to look precisely where a person is most agitated, which is generally also where ${c.they} are least honest with ${c.themselves}.`
      },
      {
        spoken:  (c) => `If there's anything in ${c.them} causing damage, show it to ${c.them}. Then walk ${c.them} onto the road that actually goes somewhere.`,
        explain: (c) => `Two roads are contrasted: a <em>derek ʿotseb</em> — a way of pain, or of idols — and the <em>derek ʿolam</em>, the everlasting way. Notice the prayer isn't "make ${c.them} feel bad about the first." It's "get ${c.them} onto the second." Conviction with a destination attached.`
      }
    ]
  },
  {
    ref: 'John 17:15–21',
    theme: "Jesus's own prayer — kept, holy, one",
    flowing: {
      solo: (c) => `Father, this is what Jesus asked for his own, so I ask it for ${c.pair}.\n\nDon't take ${c.themP} out of the world — keep ${c.themP} from what would destroy ${c.themP}.\n\nMake ${c.themP} holy by the truth; your word is truth.\n\nAnd make ${c.themP} one, as you and the Son are one — so that the world would believe you sent him.`,
      family: (c) => `Father, this is what Jesus asked for his own, so we ask it for ${c.pair}.\n\nDon't take ${c.themP} out of the world — keep ${c.themP} from what would destroy ${c.themP}.\n\nMake ${c.themP} holy by the truth; your word is truth.\n\nAnd make ${c.themP} one, as you and the Son are one — so that the world would believe you sent him.`,
      kids: (c) => `God, Jesus prayed this for his friends, so we're praying it for ${c.pair}.\n\nPlease keep ${c.themP} safe from what's bad for ${c.themP}.\n\nHelp ${c.themP} to know what's true.\n\nAnd help ${c.themP} to be close to each other, the way you and Jesus are close.`
    },
    sections: [
      {
        spoken:  (c) => `Father — Jesus didn't ask for his own to be taken out of the world. So I won't either. Keep ${c.them} in it, and keep ${c.them} from what would wreck ${c.them}.`,
        explain: (c) => `Jesus explicitly declines the escape option — <em>arēs autous ek tou kosmou</em>, "take them out of the world" — and asks instead for protection <em>within</em> it. Praying this means giving up the wish that the people you love be spared difficulty, and asking instead that ${c.they} be kept <em>through</em> it. It is a harder prayer than it first sounds.`
      },
      {
        spoken:  (c) => `Make ${c.them} holy — set apart — and do it with truth. Not with pressure. With what's actually true.`,
        explain: (c) => `<em>Hagiazō</em> — to consecrate, to set aside for a purpose. And the instrument is named: "your word is truth." The mechanism of becoming holy here is sustained exposure to what's real, not effort or intensity. You're asking that truth would be allowed to do its own work in ${c.them}.`
      },
      {
        spoken:  (c) => `And make ${c.them} one — the way you and Jesus are one. Not polite. Actually one. So that people watching would believe.`,
        explain: (c) => `The comparison is staggering: <em>kathōs</em> — "just as" you, Father, are in me. Jesus prays for a family likeness to the Trinity itself, and then gives the reason: "so that the world may believe that you sent me." Unity here isn't for our comfort. It's evidence.`
      }
    ]
  }
];

export const blessing = {
  flowing: {
    solo:   (c) => `The Lord bless ${c.pair} and keep ${c.themP};\nthe Lord make his face shine on ${c.themP} and be gracious to ${c.themP};\nthe Lord turn his face toward ${c.themP} and give ${c.themP} peace.`,
    family: (c) => `The Lord bless ${c.pair} and keep ${c.themP};\nthe Lord make his face shine on ${c.themP} and be gracious to ${c.themP};\nthe Lord turn his face toward ${c.themP} and give ${c.themP} peace.`,
    kids:   (c) => `May the Lord bless ${c.pair} and keep ${c.themP} safe.\nMay the Lord smile on ${c.themP} and be kind to ${c.themP}.\nMay the Lord look at ${c.themP} and give ${c.themP} peace.`
  },
  explain: (c) => `The oldest known biblical prayer \u2014 Numbers 6:24\u201326. Three couplets, each pairing an action with a result. <em>Bless and keep</em>: God's favour and his protective oversight. <em>Make his face shine and be gracious</em>: his attention turned toward ${c.them} with delight, not duty. <em>Turn his face and give peace</em>: his presence resulting in <em>shalom</em> \u2014 wholeness, not just calm. You're not blessing ${c.them} yourself; you're invoking God's name over ${c.them} (verse 27 \u2014 "so they will put my name on the Israelites, and I will bless them"). The blessing is God's. You're the channel.`
};

export const lordsPrayer = {
  text: `Our Father in heaven,<br>hallowed be your name,<br>your kingdom come,<br>your will be done,<br>on earth as it is in heaven.<br><br>Give us today our daily bread.<br>And forgive us our debts,<br>as we also have forgiven our debtors.<br>And lead us not into temptation,<br>but deliver us from evil.<br><br>For yours is the kingdom<br>and the power and the glory,<br>for ever and ever.`,
  explain: `Jesus's pattern prayer (Matthew 6, Luke 11). Notice the structure: it starts with God's name, kingdom, and will \u2014 orientation \u2014 before requesting daily bread or forgiveness. Personal needs are framed inside God's purposes, not the other way round. <em>Our daily bread</em> assumes daily dependence, not stockpiling. <em>Forgive us as we forgive</em> ties our reception of grace to our giving of it. The final doxology (<em>for yours is the kingdom\u2026</em>) isn't in the earliest manuscripts but is liturgically ancient and theologically true \u2014 ending where it began, with God's reign.`
};

export const petitionPrompts = [
  (n1, n2) => `Picture ${n1} and ${n2} this morning. What do you see?`,
  (n1, n2) => `What are ${n1} and ${n2} carrying right now? Bring it to God.`,
  (n1, n2) => `What gift is emerging in ${n1} or ${n2} that you can thank God for?`,
  (n1, n2) => `Where do ${n1} and ${n2} most need God's presence today?`,
  (n1, n2) => `What is one hope you hold for ${n1} and ${n2}? Speak it to God.`,
  (n1, n2) => `Is there a conversation ${n1} or ${n2} needs to have? Pray over it.`,
  (n1, n2) => `What would it look like for ${n1} and ${n2} to flourish this week?`
];
export const kidsPetitionPrompts = [
  (n1, n2) => `Close your eyes. Picture ${n1} and ${n2}. What do you think they need today?`,
  (n1, n2) => `What's one thing you love about ${n1} and ${n2}? Thank God for it.`,
  (n1, n2) => `Is there something you want God to do for ${n1} and ${n2}? Tell him.`,
  (n1, n2) => `Think about ${n1} and ${n2}'s day ahead. What would you ask God to help with?`
];
