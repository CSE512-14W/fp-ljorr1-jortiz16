for i in {201..460}
do
    convert "halo$i.png" -resize 50% "halo_small$i.png"
done