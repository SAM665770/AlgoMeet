import toast from "react-hot-toast"


const HomePage = () => {
  return (
    <div>
        <button onClick={()=> toast.success("Hello World")} className="btn btn-secondary">Click Me</button>
    </div>
  )
}

export default HomePage