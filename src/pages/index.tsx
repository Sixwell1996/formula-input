import type { NextPage } from 'next';
import FormulaInput from '../components/FormulaInput';

const Home: NextPage = () => {
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Formula Input Task</h1>
            <FormulaInput />
        </div>
    );
};

export default Home;
