import userButton from '/public/userbutton.svg';
function UserButton() {
    return(
        <button className="userButton absolute flex w-10 h-12 shadow-lg bg-white items-center justify-center right-4 top-4 bg-opacity-80 rounded-full">
            <img src= {userButton} alt= "userbutton" title= "user"/>
        </button>
    )
}
export default UserButton;