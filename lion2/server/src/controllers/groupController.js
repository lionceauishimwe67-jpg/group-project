const Group = require('../models/Group');
const Membership = require('../models/Membership');
const Contribution = require('../models/Contribution');
const User = require('../models/User');

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

exports.listMyGroups = async (req, res, next) => {
  try {
    const memberships = await Membership.find({
      user: req.user.id,
      isActive: true,
    }).select('group');

    const groupIds = memberships.map((m) => m.group);

    const groups = await Group.find({
      _id: { $in: groupIds },
    }).sort({ createdAt: -1 });

    res.json({ groups });
  } catch (err) {
    next(err);
  }
};

exports.getGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const membership = await Membership.findOne({
      group: groupId,
      user: req.user.id,
      isActive: true,
    });
    if (!membership && String(group.owner) !== req.user.id) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    res.json({ group });
  } catch (err) {
    next(err);
  }
};

exports.createGroup = async (req, res, next) => {
  try {
    const {
      name,
      description,
      monthlyContributionAmount,
      payoutDayOfMonth,
      startDate,
    } = req.body;

    if (!name || !monthlyContributionAmount || !payoutDayOfMonth || !startDate) {
      return res.status(400).json({
        message: 'name, monthlyContributionAmount, payoutDayOfMonth and startDate are required',
      });
    }

    const start = new Date(startDate);

    const group = await Group.create({
      name,
      description,
      owner: req.user.id,
      monthlyContributionAmount,
      payoutDayOfMonth,
      startDate: start,
      payouts: [],
    });

    // Creator becomes first member
    const creatorMembership = await Membership.create({
      user: req.user.id,
      group: group._id,
      rotationPosition: 1,
    });

    // Initialize payouts array with the creator as the first payout
    const firstPayoutDate = new Date(
      start.getFullYear(),
      start.getMonth(),
      payoutDayOfMonth
    );

    group.payouts.push({
      member: creatorMembership.user,
      rotationPosition: 1,
      cycleNumber: 1,
      scheduledDate: firstPayoutDate,
      paid: false,
    });

    await group.save();

    res.status(201).json({ group });
  } catch (err) {
    next(err);
  }
};

exports.joinGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const existing = await Membership.findOne({
      group: groupId,
      user: req.user.id,
    });
    if (existing) {
      return res.status(400).json({ message: 'Already a member of this group' });
    }

    const maxRotation = await Membership.find({ group: groupId })
      .sort({ rotationPosition: -1 })
      .limit(1);
    const nextRotation = maxRotation.length ? maxRotation[0].rotationPosition + 1 : 1;

    const membership = await Membership.create({
      group: groupId,
      user: req.user.id,
      rotationPosition: nextRotation,
    });

    // Append payout for this new member at the end of the cycle order
    const lastPayout = group.payouts.reduce(
      (max, p) => (p.cycleNumber > max ? p.cycleNumber : max),
      0
    );
    const cycleNumber = lastPayout + 1;
    const scheduledDate = addMonths(group.startDate, cycleNumber - 1);
    scheduledDate.setDate(group.payoutDayOfMonth);

    group.payouts.push({
      member: membership.user,
      rotationPosition: membership.rotationPosition,
      cycleNumber,
      scheduledDate,
      paid: false,
    });

    await group.save();

    res.status(201).json({ membership, group });
  } catch (err) {
    next(err);
  }
};

exports.updateRotation = async (req, res, next) => {
  try {
    const { groupId, membershipId } = req.params;
    const { rotationPosition } = req.body;

    if (!rotationPosition || rotationPosition < 1) {
      return res.status(400).json({ message: 'rotationPosition must be >= 1' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (String(group.owner) !== req.user.id) {
      return res.status(403).json({ message: 'Only the group owner can update rotation' });
    }

    const membership = await Membership.findOne({ _id: membershipId, group: groupId });
    if (!membership) {
      return res.status(404).json({ message: 'Membership not found' });
    }

    membership.rotationPosition = rotationPosition;
    await membership.save();

    // Rebuild payouts according to updated rotation positions
    const memberships = await Membership.find({ group: groupId, isActive: true }).sort({
      rotationPosition: 1,
    });

    group.payouts = memberships.map((m, index) => {
      const cycleNumber = index + 1;
      const scheduledDate = addMonths(group.startDate, cycleNumber - 1);
      scheduledDate.setDate(group.payoutDayOfMonth);
      return {
        member: m.user,
        rotationPosition: m.rotationPosition,
        cycleNumber,
        scheduledDate,
        paid: false,
      };
    });

    await group.save();

    res.json({ group });
  } catch (err) {
    next(err);
  }
};

exports.recordContribution = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { amount, month, year } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const membership = await Membership.findOne({
      group: groupId,
      user: req.user.id,
      isActive: true,
    });
    if (!membership) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    const dueDate = new Date(year, month - 1, group.payoutDayOfMonth);
    const now = new Date();
    const status = now > dueDate ? 'late' : 'paid';

    const contribution = await Contribution.create({
      group: groupId,
      user: req.user.id,
      amount: amount || group.monthlyContributionAmount,
      month,
      year,
      dueDate,
      paidDate: now,
      status,
    });

    res.status(201).json({ contribution });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: 'Contribution for this month already recorded' });
    }
    next(err);
  }
};

exports.getDashboard = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId).populate('owner', 'name email');
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const memberships = await Membership.find({ group: groupId, isActive: true }).populate(
      'user',
      'name email'
    );

    const contributions = await Contribution.find({ group: groupId });

    const totalContributed = contributions.reduce(
      (sum, c) => sum + (c.amount || 0),
      0
    );

    const nextPayout = group.payouts
      .filter((p) => !p.paid)
      .sort((a, b) => a.cycleNumber - b.cycleNumber)[0] || null;

    let nextPayoutMember = nextPayout;
    if (nextPayout && nextPayout.member) {
      const memberUser = await User.findById(nextPayout.member).select('name email');
      nextPayoutMember = {
        ...nextPayout.toObject ? nextPayout.toObject() : nextPayout,
        memberUser: memberUser || null,
      };
    }

    const remainingCycles = group.payouts.filter((p) => !p.paid).length;

    const latePayments = contributions.filter((c) => c.status === 'late');

    res.json({
      group,
      memberships,
      metrics: {
        totalContributed,
        nextPayoutMember,
        remainingCycles,
        latePayments,
      },
    });
  } catch (err) {
    next(err);
  }
};

