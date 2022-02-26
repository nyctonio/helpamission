const workOpener = (id) => {
    let ele = document.createElement('a');
    ele.href = '/work/' + id;
    ele.target = '_blank';
    ele.click();
}