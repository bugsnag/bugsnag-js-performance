class FixedProbabilityManager {
    static async create(sampler, samplingProbability) {
        sampler.probability = samplingProbability;
        return new FixedProbabilityManager(sampler, samplingProbability);
    }
    constructor(sampler, samplingProbability) {
        this.sampler = sampler;
        this.samplingProbability = samplingProbability;
    }
    setProbability(newProbability) {
        return Promise.resolve();
    }
    ensureFreshProbability() {
        return Promise.resolve();
    }
}
export default FixedProbabilityManager;
